import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const OWNER_EMAIL = "e2e-invite-owner@example.com";
const OWNER_PASSWORD = "Test@12345";
const INVITEE_EMAIL = "delivered+e2e-invitee@resend.dev";
const INVITEE_NAME = "E2E Invitee";
const INVITEE_PASSWORD = "Test@12345";
const BASE_URL = "http://localhost:3000";

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [OWNER_EMAIL, INVITEE_EMAIL] } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  await prisma.inviteToken.deleteMany({
    where: {
      OR: [{ email: INVITEE_EMAIL }, { workspaceId: { in: workspaceIds } }],
    },
  });
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: { in: userIds } },
  });
  await prisma.workspaceMember.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { workspaceId: { in: workspaceIds } }],
    },
  });
  await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

test.describe("Invite flow", () => {
  let workspaceId: string;

  test.beforeEach(async () => {
    await cleanup();

    const owner = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        name: "E2E Owner",
        password: await bcrypt.hash(OWNER_PASSWORD, 10),
        emailVerified: true,
      },
    });
    const workspace = await prisma.workspace.create({
      data: { name: "E2E Invite Workspace", ownerId: owner.id },
    });
    workspaceId = workspace.id;
    await prisma.workspaceMember.create({
      data: { userId: owner.id, workspaceId, role: "OWNER" },
    });
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("owner invites a member as ADMIN and invitee joins via the link", async ({
    page,
    browser,
  }) => {
    test.setTimeout(90000);

    // 1. Owner logs in through the UI
    await page.goto("/login");
    await page.getByPlaceholder("hassan@team.com").fill(OWNER_EMAIL);
    await page.getByPlaceholder("••••••••").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(new RegExp(`/workspaces/${workspaceId}`), {
      timeout: 20000,
    });

    // 2. Owner sends an invite as Admin
    await page.goto(`/workspaces/${workspaceId}/members`);
    await page.getByPlaceholder("teammate@company.com").fill(INVITEE_EMAIL);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Admin" }).click();
    await page.getByRole("button", { name: "Send invite" }).click();

    await expect(page.getByText(INVITEE_EMAIL)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("invited as admin")).toBeVisible();

    // 3. Check the invite row in the database
    const invite = await prisma.inviteToken.findFirst({
      where: { email: INVITEE_EMAIL, workspaceId },
    });
    expect(invite).not.toBeNull();
    expect(invite!.role).toBe("ADMIN");
    expect(invite!.used).toBe(false);

    // 4. Invitee opens the link in a completely fresh browser
    const inviteeContext = await browser.newContext({ baseURL: BASE_URL });
    const inviteePage = await inviteeContext.newPage();

    await inviteePage.goto(`/invite?token=${invite!.token}`);
    await expect(inviteePage).toHaveURL(/\/signup/, { timeout: 20000 });

    const emailInput = inviteePage.getByPlaceholder("hassan@team.com");
    await expect(emailInput).toHaveValue(INVITEE_EMAIL);
    await expect(emailInput).not.toBeEditable();

    // 5. Invitee signs up
    await inviteePage.getByPlaceholder("Hassan Khan").fill(INVITEE_NAME);
    await inviteePage
      .getByPlaceholder("At least 8 characters")
      .fill(INVITEE_PASSWORD);
    await inviteePage.getByRole("button", { name: "Start flowing" }).click();

    await expect(inviteePage).toHaveURL(
      new RegExp(`/workspaces/${workspaceId}`),
      { timeout: 30000 },
    );

    // 6. Check the database
    const invitee = await prisma.user.findUnique({
      where: { email: INVITEE_EMAIL },
    });
    expect(invitee).not.toBeNull();
    expect(invitee!.emailVerified).toBe(true);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: invitee!.id },
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0].workspaceId).toBe(workspaceId);
    expect(memberships[0].role).toBe("ADMIN");

    const ownedWorkspaces = await prisma.workspace.count({
      where: { ownerId: invitee!.id },
    });
    expect(ownedWorkspaces).toBe(0);

    const usedInvite = await prisma.inviteToken.findFirst({
      where: { email: INVITEE_EMAIL, workspaceId },
    });
    expect(usedInvite?.used).toBe(true);

    await inviteeContext.close();
  });
});
