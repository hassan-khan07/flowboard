import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { isSoleOwner } from "@/lib/permissions";

export async function DELETE(
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
  if (await isSoleOwner(workspaceId, userId)) {
    return Response.json(
      {
        error:
          "You're the only owner of this workspace. Transfer ownership to someone else before leaving/removing.",
      },
      { status: 400 },
    );
  }
  await prisma.workspaceMember.delete({
    where: { id: requesterMembership.id },
  });

  return Response.json({
    success: true,
    message: "Leave workspace sucessfully",
  });
}
