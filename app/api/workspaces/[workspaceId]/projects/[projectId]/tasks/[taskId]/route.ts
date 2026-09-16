import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema, updateTaskSchema } from "@/schemas/taskSchema";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; projectId: string; taskId: string }>;
  },
) {
  const { workspaceId, projectId, taskId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to update this task." },
      { status: 401 },
    );
  }

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!requesterMembership) {
    return NextResponse.json(
      { message: "You're not a member of this workspace." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const validation = updateTaskSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Please check the task details and try again.",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = validation.data;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { message: "No changes were provided to update." },
      { status: 400 },
    );
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: projectId,
      project: {
        workspaceId,
      },
    },
  });

  if (!task) {
    return NextResponse.json(
      { message: "This task couldn't be found." },
      { status: 404 },
    );
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      lastModifiedById: session.user.id,
      lastModifiedAt: new Date(),
    },
  });

  return NextResponse.json(
    { message: "Task updated successfully.", task: updatedTask },
    { status: 200 },
  );
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; projectId: string; taskId: string }>;
  },
) {
  const { workspaceId, projectId, taskId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to delete this task." },
      { status: 401 },
    );
  }

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!requesterMembership) {
    return NextResponse.json(
      { message: "You're not a member of this workspace." },
      { status: 403 },
    );
  }

  if (requesterMembership.role === "MEMBER") {
    return NextResponse.json(
      { message: "Only workspace owners and admins can delete tasks." },
      { status: 403 },
    );
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: projectId,
      project: {
        workspaceId,
      },
    },
  });

  if (!task) {
    return NextResponse.json(
      { message: "This task couldn't be found." },
      { status: 404 },
    );
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return NextResponse.json(
    { message: "Task deleted successfully." },
    { status: 200 },
  );
}
