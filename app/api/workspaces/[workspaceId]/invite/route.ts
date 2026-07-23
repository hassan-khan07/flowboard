import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

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

  const body = await request.json();
  const { email, role } = body;
  const randomToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const findUserByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (findUserByEmail) {
    const inviteeMembership = await prisma.workspaceMember.findFirst({
      where: { userId: findUserByEmail.id, workspaceId: workspaceId },
    });

    if (inviteeMembership) {
      return Response.json(
        {
          success: false,
          message: "User is already a member of this workspace",
        },
        { status: 403 },
      );
    }
  }
}
