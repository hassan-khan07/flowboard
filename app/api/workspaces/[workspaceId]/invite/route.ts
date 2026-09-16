import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendInviteEmail } from "@/helpers/sendInviteEmail";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
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
    return NextResponse.json(
      {
        success: false,
        message: "User is not a member of this workspace",
      },
      { status: 403 },
    );
  }

  if (requesterMembership_roleCheck.role === "MEMBER") {
    return NextResponse.json(
      {
        success: false,
        message: "Only Owner or Admin can perform this action",
      },
      { status: 403 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return NextResponse.json(
      { message: "Workspace not found." },
      { status: 404 },
    );
  }

  if (workspace.plan === "FREE") {
    const [memberCount, pendingCount] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.inviteToken.count({ where: { workspaceId, used: false } }),
    ]);

    if (memberCount + pendingCount >= 3) {
      return NextResponse.json(
        {
          message:
            "This workspace has reached the Free plan's 3-member limit. Upgrade to Pro to invite more members.",
        },
        { status: 409 },
      );
    }
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
      return NextResponse.json(
        {
          success: false,
          message: "User is already a member of this workspace",
        },
        { status: 403 },
      );
    }
  }

  const invite = await prisma.inviteToken.upsert({
    where: {
      email_workspaceId: {
        email: email,
        workspaceId: workspaceId,
      },
    },
    update: {
      token: randomToken,
      expiresAt: expiresAt,
      used: false,
      role: role,
    },
    create: {
      email: email,
      workspaceId: workspaceId,
      token: randomToken,
      expiresAt: expiresAt,
      used: false,
      role: role,
    },
  });

  const emailResult = await sendInviteEmail(
    workspace?.name || "the workspace",
    email,
    role,
    invite.token,
  );

  if (!emailResult.success) {
    return NextResponse.json(
      { success: false, message: emailResult.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "Invite sent" });
}
