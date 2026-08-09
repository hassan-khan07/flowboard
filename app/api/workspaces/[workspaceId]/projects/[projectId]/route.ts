import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const { workspaceId, projectId } = await params;

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
        message: "Only Owner or Admin can delete a project",
      },
      { status: 403 },
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (project === null) {
    return Response.json(
      { success: false, message: "This project no longer exists." },
      { status: 404 },
    );
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ success: true, message: "Project deleted" });
}
