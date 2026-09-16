import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/schemas/taskSchema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const { workspaceId, projectId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to create a task." },
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
      { message: "Only workspace owners and admins can create tasks." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const validation = taskSchema.safeParse(body);

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

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return NextResponse.json(
      { message: "This project couldn't be found." },
      { status: 404 },
    );
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      projectId,
    },
  });

  return NextResponse.json(
    { message: "Task created successfully.", task },
    { status: 201 },
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const { workspaceId, projectId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to view tasks." },
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

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return NextResponse.json(
      { message: "This project couldn't be found." },
      { status: 404 },
    );
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ message: "Tasks fetched successfully.", tasks });
}
