import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  const { workspaceId, inviteId } = await params;

  const session = await auth();

  if (!session?.user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }
  const userId = session?.user.id;

  const requesterMembership_roleCheck = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (requesterMembership_roleCheck === null) {
    return Response.json(
      {
        success: false,
        message: "User is not a member of this workspace",
      },
      { status: 403 },
    );
  }

  if (requesterMembership_roleCheck.role === "MEMBER") {
    return Response.json(
      {
        success: false,
        message: "Only Owner or Admin can perform this action",
      },
      { status: 403 },
    );
  }

  const inviteToken = await prisma.inviteToken.findFirst({
    where: { id: inviteId },
  });

  if (inviteToken === null) {
    return Response.json(
      {
        success: false,
        message: "This invite no longer exists.",
      },
      { status: 404 },
    );
  }

  if (inviteToken.workspaceId !== workspaceId) {
    return Response.json(
      {
        success: false,
        message: "This invite no longer exists.",
      },
      { status: 404 },
    );
  }

  await prisma.inviteToken.delete({
    where: { id: inviteId },
  });

  return Response.json({ success: true, message: "Invite revoked" });
}
