import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  const session = await auth();

  if (!session?.user) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (requesterMembership === null) {
    return Response.json(
      { success: false, message: "User is not a member of this workspace" },
      { status: 403 },
    );
  }

  if (requesterMembership.role === "MEMBER") {
    return Response.json(
      {
        success: false,
        message: "Only Owner or Admin can create a project",
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { success: false, message: "Invalid input" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      workspaceId,
    },
  });

  return Response.json({ success: true, project });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  const session = await auth();

  if (!session?.user) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (requesterMembership === null) {
    return Response.json(
      { success: false, message: "User is not a member of this workspace" },
      { status: 403 },
    );
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
  });

  return Response.json({ success: true, projects });
}
