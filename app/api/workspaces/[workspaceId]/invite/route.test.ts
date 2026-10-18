import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";
import type { Mock } from "vitest";
import { auth } from "@/auth";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/helpers/sendInviteEmail", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue({ success: true, message: "ok" }),
}));

const mockedAuth = auth as unknown as Mock;

describe("POST /api/workspaces/[workspaceId]/invite", () => {
  let ownerId: string;
  let workspaceId: string;

  const makeRequest = (body: object) =>
    new NextRequest(`http://localhost/api/workspaces/${workspaceId}/invite`, {
      method: "POST",
      body: JSON.stringify(body),
    });

  const callPost = (body: object) =>
    POST(makeRequest(body), { params: Promise.resolve({ workspaceId }) });

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { email: "test-invite-route-owner@example.com", name: "Owner" },
    });
    ownerId = owner.id;

    const workspace = await prisma.workspace.create({
      data: { name: "Invite Route Workspace", ownerId },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: { userId: ownerId, workspaceId, role: "OWNER" },
    });
  });

  afterAll(async () => {
    await prisma.inviteToken.deleteMany({ where: { workspaceId } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.delete({ where: { id: ownerId } });
  });

  it("returns 401 if there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await callPost({ email: "a@example.com", role: "MEMBER" });

    expect(response.status).toBe(401);
  });

  it("returns 403 if the user's role is MEMBER", async () => {
    const memberUser = await prisma.user.create({
      data: { email: "test-invite-route-member@example.com", name: "Member" },
    });
    await prisma.workspaceMember.create({
      data: { userId: memberUser.id, workspaceId, role: "MEMBER" },
    });
    mockedAuth.mockResolvedValue({ user: { id: memberUser.id } });

    const response = await callPost({ email: "a@example.com", role: "MEMBER" });

    expect(response.status).toBe(403);

    await prisma.workspaceMember.deleteMany({
      where: { userId: memberUser.id, workspaceId },
    });
    await prisma.user.delete({ where: { id: memberUser.id } });
  });

  it("returns 400 if role is OWNER", async () => {
    mockedAuth.mockResolvedValue({ user: { id: ownerId } });

    const response = await callPost({
      email: "owner-attempt@example.com",
      role: "OWNER",
    });

    expect(response.status).toBe(400);

    const invite = await prisma.inviteToken.findFirst({
      where: { email: "owner-attempt@example.com", workspaceId },
    });
    expect(invite).toBeNull();
  });

  it("returns 400 if email is invalid", async () => {
    mockedAuth.mockResolvedValue({ user: { id: ownerId } });

    const response = await callPost({ email: "not-an-email", role: "MEMBER" });

    expect(response.status).toBe(400);
  });

  it("returns 200 and stores the invite with the ADMIN role", async () => {
    mockedAuth.mockResolvedValue({ user: { id: ownerId } });

    const response = await callPost({
      email: "new-admin@example.com",
      role: "ADMIN",
    });

    expect(response.status).toBe(200);

    const invite = await prisma.inviteToken.findFirst({
      where: { email: "new-admin@example.com", workspaceId },
    });
    expect(invite?.role).toBe("ADMIN");
    expect(invite?.used).toBe(false);
  });
});
