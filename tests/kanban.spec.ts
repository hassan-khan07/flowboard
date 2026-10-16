import { test, expect, type Page, type Locator } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const OWNER_EMAIL = "e2e-kanban-owner@example.com";
const MEMBER_EMAIL = "e2e-kanban-member@example.com";
const PASSWORD = "Test@12345";

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [OWNER_EMAIL, MEMBER_EMAIL] } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  await prisma.task.deleteMany({
    where: { project: { workspaceId: { in: workspaceIds } } },
  });
  await prisma.project.deleteMany({
    where: { workspaceId: { in: workspaceIds } },
  });
  await prisma.workspaceMember.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { workspaceId: { in: workspaceIds } }],
    },
  });
  await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function login(page: Page, email: string, workspaceId: string) {
  await page.goto("/login");
  await page.getByPlaceholder("hassan@team.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`/workspaces/${workspaceId}`), {
    timeout: 20000,
  });
}

async function dragCardToColumn(page: Page, card: Locator, column: Locator) {
  const cardBox = await card.boundingBox();
  const columnBox = await column.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Could not find the card or the column on screen");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + columnBox.height / 2,
    { steps: 15 },
  );
  await page.mouse.up();
}

test.describe("Kanban board", () => {
  test.describe.configure({ timeout: 90000 });

  let workspaceId: string;
  let projectId: string;
  let taskId: string;
  let ownerId: string;
  let memberId: string;

  test.beforeEach(async () => {
    await cleanup();

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const owner = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        name: "E2E Owner",
        password: passwordHash,
        emailVerified: true,
      },
    });
    const member = await prisma.user.create({
      data: {
        email: MEMBER_EMAIL,
        name: "E2E Member",
        password: passwordHash,
        emailVerified: true,
      },
    });
    ownerId = owner.id;
    memberId = member.id;

    const workspace = await prisma.workspace.create({
      data: { name: "E2E Kanban Workspace", ownerId },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.createMany({
      data: [
        { userId: ownerId, workspaceId, role: "OWNER" },
        { userId: memberId, workspaceId, role: "MEMBER" },
      ],
    });

    const project = await prisma.project.create({
      data: { name: "E2E Board", workspaceId },
    });
    projectId = project.id;

    const task = await prisma.task.create({
      data: {
        title: "E2E Task",
        status: "TODO",
        priority: "MEDIUM",
        projectId,
      },
    });
    taskId = task.id;
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("owner drags a task from To Do to In Progress", async ({ page }) => {
    await login(page, OWNER_EMAIL, workspaceId);
    await page.goto(`/workspaces/${workspaceId}/projects/${projectId}`);

    const card = page.getByTestId(`task-${taskId}`);
    await expect(card).toBeVisible({ timeout: 20000 });

    await dragCardToColumn(page, card, page.getByTestId("column-IN_PROGRESS"));

    const movedCard = page
      .getByTestId("column-IN_PROGRESS")
      .getByTestId(`task-${taskId}`);
    await expect(movedCard).toContainText("Updated by E2E Owner", {
      timeout: 15000,
    });
    await expect(
      page.getByTestId("column-TODO").getByTestId(`task-${taskId}`),
    ).toHaveCount(0);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.status).toBe("IN_PROGRESS");
    expect(task?.lastModifiedById).toBe(ownerId);
  });

  test("owner edits a task's title and priority", async ({ page }) => {
    await login(page, OWNER_EMAIL, workspaceId);
    await page.goto(`/workspaces/${workspaceId}/projects/${projectId}`);

    const card = page.getByTestId(`task-${taskId}`);
    await card.hover();
    await card.getByRole("button", { name: "Edit task" }).click();

    await page.getByRole("textbox").fill("E2E Task Renamed");
    await page.getByRole("button", { name: "High", exact: true }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Edit task" })).toBeHidden({
      timeout: 15000,
    });
    await expect(card).toContainText("E2E Task Renamed");

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.title).toBe("E2E Task Renamed");
    expect(task?.priority).toBe("HIGH");
  });

  test("owner deletes a task", async ({ page }) => {
    await login(page, OWNER_EMAIL, workspaceId);
    await page.goto(`/workspaces/${workspaceId}/projects/${projectId}`);

    const card = page.getByTestId(`task-${taskId}`);
    page.once("dialog", (dialog) => dialog.accept());

    await card.hover();
    await card.getByRole("button", { name: "Edit task" }).click();
    await page.getByRole("button", { name: "Delete task" }).click();

    await expect(card).toHaveCount(0, { timeout: 15000 });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task).toBeNull();
  });

  test("member can edit a task but cannot delete it", async ({ page }) => {
    await login(page, MEMBER_EMAIL, workspaceId);
    await page.goto(`/workspaces/${workspaceId}/projects/${projectId}`);

    const card = page.getByTestId(`task-${taskId}`);

    // Edit is allowed for every role
    await card.hover();
    await card.getByRole("button", { name: "Edit task" }).click();
    await page.getByRole("textbox").fill("Edited by member");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(card).toContainText("Edited by member", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Edit task" })).toBeHidden();

    // Delete is blocked for MEMBER
    page.once("dialog", (dialog) => dialog.accept());
    await card.hover();
    await card.getByRole("button", { name: "Edit task" }).click();
    await page.getByRole("button", { name: "Delete task" }).click();

    await expect(
      page.getByText("Only workspace owners and admins can delete tasks."),
    ).toBeVisible();

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task).not.toBeNull();
    expect(task?.title).toBe("Edited by member");
    expect(task?.lastModifiedById).toBe(memberId);
  });
});
