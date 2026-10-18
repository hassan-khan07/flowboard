import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

vi.mock("@/helpers/sendVerificationEmail", () => ({
  sendVerificationEmail: vi
    .fn()
    .mockResolvedValue({ success: true, message: "ok" }),
}));

const OWNER_EMAIL = "test-signup-route-owner@example.com";
const INVITEE_EMAIL = "test-signup-route-invitee@example.com";
const ATTACKER_EMAIL = "test-signup-route-attacker@example.com";
const EXISTING_EMAIL = "test-signup-route-existing@example.com";
const SIGNUP_EMAILS = [INVITEE_EMAIL, ATTACKER_EMAIL, EXISTING_EMAIL];

describe("POST /api/signup (invite flow)", () => {
  let ownerId: string;
  let workspaceId: string;

  const callPost = (body: object) =>
    POST(
      new Request("http://localhost/api/signup", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );

  const createInvite = (
    token: string,
    overrides: { used?: boolean; expiresAt?: Date } = {},
  ) =>
    prisma.inviteToken.create({
      data: {
        email: INVITEE_EMAIL,
        role: "ADMIN",
        token,
        workspaceId,
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
        used: overrides.used ?? false,
      },
    });

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { email: OWNER_EMAIL, name: "Owner" },
    });
    ownerId = owner.id;
    const workspace = await prisma.workspace.create({
      data: { name: "Signup Route Workspace", ownerId },
    });
    workspaceId = workspace.id;
    await prisma.workspaceMember.create({
      data: { userId: ownerId, workspaceId, role: "OWNER" },
    });
  });

  afterEach(async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: SIGNUP_EMAILS } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    await prisma.inviteToken.deleteMany({ where: { workspaceId } });
    await prisma.workspaceMember.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  afterAll(async () => {
    await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.delete({ where: { id: ownerId } });
  });

  it("returns 400 if the input is invalid", async () => {
    const response = await callPost({
      name: "Test Person",
      email: INVITEE_EMAIL,
      password: "short",
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if an account with this email already exists", async () => {
    await prisma.user.create({
      data: { email: EXISTING_EMAIL, name: "Existing" },
    });

    const response = await callPost({
      name: "Test Person",
      email: EXISTING_EMAIL,
      password: "Test@12345",
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if the invite token does not exist", async () => {
    const response = await callPost({
      name: "Test Person",
      email: INVITEE_EMAIL,
      password: "Test@12345",
      token: "token-that-does-not-exist",
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if the invite was already used", async () => {
    await createInvite("used-token-123", { used: true });

    const response = await callPost({
      name: "Test Person",
      email: INVITEE_EMAIL,
      password: "Test@12345",
      token: "used-token-123",
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if the invite has expired", async () => {
    await createInvite("expired-token-123", {
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const response = await callPost({
      name: "Test Person",
      email: INVITEE_EMAIL,
      password: "Test@12345",
      token: "expired-token-123",
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if the email does not match the invited email", async () => {
    await createInvite("valid-token-123");

    const response = await callPost({
      name: "Attacker",
      email: ATTACKER_EMAIL,
      password: "Test@12345",
      token: "valid-token-123",
    });

    expect(response.status).toBe(400);

    const attacker = await prisma.user.findUnique({
      where: { email: ATTACKER_EMAIL },
    });
    expect(attacker).toBeNull();

    const invite = await prisma.inviteToken.findFirst({
      where: { token: "valid-token-123" },
    });
    expect(invite?.used).toBe(false);
  });

  it("returns 200 and joins the workspace with the invited role", async () => {
    await createInvite("good-token-123");

    const response = await callPost({
      name: "Test Person",
      email: INVITEE_EMAIL,
      password: "Test@12345",
      token: "good-token-123",
    });

    expect(response.status).toBe(200);

    const user = await prisma.user.findUnique({
      where: { email: INVITEE_EMAIL },
    });
    expect(user?.emailVerified).toBe(true);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user!.id },
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0].workspaceId).toBe(workspaceId);
    expect(memberships[0].role).toBe("ADMIN");

    const ownedWorkspaces = await prisma.workspace.count({
      where: { ownerId: user!.id },
    });
    expect(ownedWorkspaces).toBe(0);

    const invite = await prisma.inviteToken.findFirst({
      where: { token: "good-token-123" },
    });
    expect(invite?.used).toBe(true);
  });
});
