import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  const { workspaceId, memberId } = await params;

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
        message: "Only Owner or Admin can perform this action",
      },
      { status: 403 },
    );
  }

  const memberToRemove = await prisma.workspaceMember.findFirst({
    where: { id: memberId },
  });

  if (memberToRemove === null) {
    return Response.json(
      { success: false, message: "This member no longer exists." },
      { status: 404 },
    );
  }

  if (memberToRemove.workspaceId !== workspaceId) {
    return Response.json(
      { success: false, message: "This member no longer exists." },
      { status: 404 },
    );
  }

  if (memberToRemove.userId === userId) {
    return Response.json(
      {
        success: false,
        message:
          "You can't remove yourself from this route. Use the leave-workspace option instead.",
      },
      { status: 400 },
    );
  }

  if (memberToRemove.role === "OWNER") {
    return Response.json(
      {
        success: false,
        message: "Workspace owners can't be removed this way.",
      },
      { status: 403 },
    );
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  return Response.json({ success: true, message: "Member removed" });
}
