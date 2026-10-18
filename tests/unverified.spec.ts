import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const EMAIL = "e2e-unverified@example.com";
const PASSWORD = "Test@12345";

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) return;
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);
  await prisma.workspaceMember.deleteMany({
    where: { OR: [{ userId: user.id }, { workspaceId: { in: workspaceIds } }] },
  });
  await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
  await prisma.user.delete({ where: { id: user.id } });
}

test.describe("Unverified user", () => {
  test.describe.configure({ timeout: 90000 });

  let workspaceId: string;

  test.beforeEach(async () => {
    await cleanup();
    const user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: "E2E Unverified",
        password: await bcrypt.hash(PASSWORD, 10),
        emailVerified: false,
      },
    });
    const workspace = await prisma.workspace.create({
      data: { name: "E2E Unverified Workspace", ownerId: user.id },
    });
    workspaceId = workspace.id;
    await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId, role: "OWNER" },
    });
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("unverified user is sent to verify-email-pending", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("hassan@team.com").fill(EMAIL);
    await page.getByPlaceholder("••••••••").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/verify-email-pending/, { timeout: 20000 });

    await page.goto(`/workspaces/${workspaceId}`);

    await expect(page).toHaveURL(/verify-email-pending/, { timeout: 15000 });
  });
});
