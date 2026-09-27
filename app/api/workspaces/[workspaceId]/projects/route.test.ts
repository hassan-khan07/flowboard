import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";
import type { Mock } from "vitest";

const mockedAuth = auth as unknown as Mock;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";

describe("GET /api/workspaces/[workspaceId]/projects", () => {
  let testUserId: string;
  let testWorkspaceId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "test-projects-get@example.com",
        name: "Test User",
      },
    });
    testUserId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        ownerId: testUserId,
      },
    });
    testWorkspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: {
        userId: testUserId,
        workspaceId: testWorkspaceId,
        role: "OWNER",
      },
    });

    await prisma.project.create({
      data: {
        name: "Test Project",
        workspaceId: testWorkspaceId,
      },
    });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { workspaceId: testWorkspaceId },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: testWorkspaceId },
    });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("returns 401 if there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ workspaceId: testWorkspaceId }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 if the user is not a member of the workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "some-random-non-member-id" },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ workspaceId: testWorkspaceId }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 200 with the workspace's projects for a valid member", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUserId },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ workspaceId: testWorkspaceId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].name).toBe("Test Project");
  });
});

describe("POST /api/workspaces/[workspaceId]/projects", () => {
  let postTestUserId: string;
  let postTestWorkspaceId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "test-projects-post@example.com",
        name: "Test User",
      },
    });
    postTestUserId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        ownerId: postTestUserId,
      },
    });
    postTestWorkspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: {
        userId: postTestUserId,
        workspaceId: postTestWorkspaceId,
        role: "OWNER",
      },
    });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { workspaceId: postTestWorkspaceId },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: postTestWorkspaceId },
    });
    await prisma.workspace.delete({ where: { id: postTestWorkspaceId } });
    await prisma.user.delete({ where: { id: postTestUserId } });
  });

  it("returns 401 if there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "Test Project" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 if the user is not a member of the workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "some-random-non-member-id" },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "Test Project" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 403 if the user's role is MEMBER", async () => {
    const memberUser = await prisma.user.create({
      data: {
        email: "test-projects-post-member@example.com",
        name: "Member User",
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: memberUser.id,
        workspaceId: postTestWorkspaceId,
        role: "MEMBER",
      },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: memberUser.id },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "Test Project" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    expect(response.status).toBe(403);

    await prisma.workspaceMember.deleteMany({
      where: { userId: memberUser.id, workspaceId: postTestWorkspaceId },
    });
    await prisma.user.delete({ where: { id: memberUser.id } });
  });

  it("returns 409 if the FREE plan project limit is already reached", async () => {
    await prisma.project.create({
      data: {
        name: "Existing Project",
        workspaceId: postTestWorkspaceId,
      },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: postTestUserId },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "Test Project" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    expect(response.status).toBe(409);

    await prisma.project.deleteMany({
      where: { workspaceId: postTestWorkspaceId },
    });
  });

  it("returns 400 if input is invalid", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: postTestUserId },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 200 if project creation is sucessfull", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: postTestUserId },
    } as any);

    const request = new NextRequest(
      `http://localhost/api/workspaces/${postTestWorkspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({ name: "New Project" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ workspaceId: postTestWorkspaceId }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.project.name).toBe("New Project");
    await prisma.project.delete({ where: { id: body.project.id } });
  });
});
