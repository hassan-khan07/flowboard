import { test, expect } from "@playwright/test";
import { prisma } from "../lib/prisma";

const TEST_EMAIL = "delivered+e2e-signup@resend.dev";
const TEST_NAME = "E2E Signup User";
const TEST_PASSWORD = "Test@12345";

async function cleanupTestUser() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) return;

  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });
  await prisma.workspaceMember.deleteMany({
    where: {
      OR: [{ userId: user.id }, { workspaceId: { in: workspaceIds } }],
    },
  });
  await prisma.workspace.deleteMany({ where: { ownerId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

test.describe("Signup flow", () => {
  test.beforeEach(async () => {
    await cleanupTestUser();
  });

  test.afterEach(async () => {
    await cleanupTestUser();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("new user signs up, gets a workspace as OWNER, and verifies email", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.goto("/signup");
    await page.getByPlaceholder("Hassan Khan").fill(TEST_NAME);
    await page.getByPlaceholder("hassan@team.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("At least 8 characters").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Start flowing" }).click();

    await expect(page).toHaveURL(/verify-email-pending/, { timeout: 15000 });
    await expect(page.getByText("Almost there")).toBeVisible();

    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(user).not.toBeNull();

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user!.id },
      include: { workspace: true },
    });
    expect(membership?.role).toBe("OWNER");
    expect(membership?.workspace.ownerId).toBe(user!.id);

    const tokenRow = await prisma.emailVerificationToken.findUnique({
      where: { userId: user!.id },
    });
    expect(tokenRow).not.toBeNull();

    await page.goto(`/verify-email?token=${tokenRow!.token}`);
    await expect(page).toHaveURL(/login\?verified=true/);

    const verifiedUser = await prisma.user.findUnique({
      where: { id: user!.id },
    });
    expect(verifiedUser?.emailVerified).toBe(true);
  });
});
