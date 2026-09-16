import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    message: "Role must be either Admin or Member.",
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  const { workspaceId, memberId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to manage members." },
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
      { message: "Only owners and admins can change member roles." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const validation = updateRoleSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: "Please select a valid role." },
      { status: 400 },
    );
  }

  const targetMember = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!targetMember) {
    return NextResponse.json(
      { message: "This member couldn't be found." },
      { status: 404 },
    );
  }

  if (targetMember.role === "OWNER") {
    return NextResponse.json(
      { message: "The workspace owner's role can't be changed here." },
      { status: 400 },
    );
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: validation.data.role },
  });

  return NextResponse.json(
    { message: "Member role updated.", member: updatedMember },
    { status: 200 },
  );
}
