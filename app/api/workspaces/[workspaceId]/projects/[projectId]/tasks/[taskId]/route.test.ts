import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";
import type { Mock } from "vitest";
import { auth } from "@/auth";

const mockedAuth = auth as unknown as Mock;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("PATCH /api/workspaces/[workspaceId]/projects/[projectId]/tasks/[taskId]", () => {
  let testUserId: string;
  let testWorkspaceId: string;
  let testProjectId: string;
  let testTaskId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "test-tasks-patch@example.com",
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

    const project = await prisma.project.create({
      data: {
        name: "Test Project",
        workspaceId: testWorkspaceId,
      },
    });
    testProjectId = project.id;

    const task = await prisma.task.create({
      data: {
        title: "Test task",
        projectId: testProjectId,
      },
    });
    testTaskId = task.id;
  });

  afterAll(async () => {
    await prisma.task.delete({
      where: { id: testTaskId },
    });
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
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${testTaskId}`,
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: testTaskId,
      }),
    });

    expect(response.status).toBe(401);
  });
  
  it("returns 403 if the user is not a member of the workspace", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "some-random-non-member-id" },
    });

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${testTaskId}`,
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: testTaskId,
      }),
    });

    expect(response.status).toBe(403);
  });
  it("returns 400 if status value is invalid", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserId },
    });

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${testTaskId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "INVALID_STATUS" }),
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: testTaskId,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 if no fields are provided to update", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserId },
    });

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${testTaskId}`,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: testTaskId,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 if no task is found", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserId },
    });

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${"nonexistent-task-id"}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "DONE" }),
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: "nonexistent-task-id",
      }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 200 if the task is updated successfully", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserId },
    });

    const request = new NextRequest(
      `http://localhost/api/workspaces/${testWorkspaceId}/projects/${testProjectId}/tasks/${testTaskId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "DONE" }),
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({
        workspaceId: testWorkspaceId,
        projectId: testProjectId,
        taskId: testTaskId,
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.task.status).toBe("DONE");
    expect(body.task.lastModifiedById).toBe(testUserId);
  });
});
