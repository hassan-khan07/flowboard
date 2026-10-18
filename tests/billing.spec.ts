import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const OWNER_EMAIL = "e2e-billing-owner@example.com";
const ADMIN_EMAIL = "e2e-billing-admin@example.com";
const OUTSIDER_EMAIL = "e2e-billing-outsider@example.com";
const PASSWORD = "Test@12345";

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [OWNER_EMAIL, ADMIN_EMAIL, OUTSIDER_EMAIL] } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  await prisma.workspaceMember.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { workspaceId: { in: workspaceIds } }],
    },
  });
  await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("hassan@team.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/workspaces\//, { timeout: 20000 });
}

test.describe("Billing", () => {
  test.describe.configure({ timeout: 90000 });

  let workspaceId: string;

  test.beforeEach(async () => {
    await cleanup();

    const hash = await bcrypt.hash(PASSWORD, 10);
    const owner = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        name: "E2E Billing Owner",
        password: hash,
        emailVerified: true,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "E2E Billing Admin",
        password: hash,
        emailVerified: true,
      },
    });

    // Outsider: a real user who is NOT a member of the workspace
    await prisma.user.create({
      data: {
        email: OUTSIDER_EMAIL,
        name: "E2E Outsider",
        password: hash,
        emailVerified: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: { name: "E2E Billing Workspace", ownerId: owner.id },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.createMany({
      data: [
        { userId: owner.id, workspaceId, role: "OWNER" },
        { userId: admin.id, workspaceId, role: "ADMIN" },
      ],
    });
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("owner clicks Upgrade and lands on Stripe Checkout", async ({
    page,
  }) => {
    await login(page, OWNER_EMAIL);
    await page.goto(`/workspaces/${workspaceId}/billing`);

    await expect(page.getByText("FREE", { exact: true })).toBeVisible();
    await page
      .getByRole("main")
      .getByRole("button", { name: "Upgrade to Pro" })
      .click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 });
  });

  test("admin cannot upgrade, sees the owner-only message", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto(`/workspaces/${workspaceId}/billing`);

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page
      .getByRole("main")
      .getByRole("button", { name: "Upgrade to Pro" })
      .click();

    await expect
      .poll(() => dialogMessage, { timeout: 15000 })
      .toContain("Only the workspace owner can manage billing.");
    await expect(page).toHaveURL(/\/billing/);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    expect(workspace?.plan).toBe("FREE");
  });

  test("PRO workspace does not show the Upgrade button", async ({ page }) => {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan: "PRO" },
    });

    await login(page, OWNER_EMAIL);
    await page.goto(`/workspaces/${workspaceId}/billing`);

    await expect(page.getByText("PRO", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: "Upgrade to Pro" }),
    ).toHaveCount(0);
  });

  test("a user who is not a member cannot open the billing page", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("hassan@team.com").fill(OUTSIDER_EMAIL);
    await page.getByPlaceholder("••••••••").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/no-workspace/, { timeout: 20000 });

    await page.goto(`/workspaces/${workspaceId}/billing`);

    await expect(page).toHaveURL(/no-workspace/, { timeout: 15000 });
    await expect(page.getByText("Current plan")).toHaveCount(0);
  });
});
