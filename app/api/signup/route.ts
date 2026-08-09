import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/schemas/signUpSchema";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: result.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 },
      );
    }

    const { email, password, name } = result.data;

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      return Response.json(
        {
          success: false,
          message:
            "An account with this email already exists. Try logging in instead.",
        },
        { status: 400 },
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

    if (token) {
      const inviteToken = await prisma.inviteToken.findFirst({
        where: { token },
      });

      if (!inviteToken) {
        return Response.json(
          {
            success: false,
            message:
              "We couldn't find this invite. It may have been revoked, or the link may be incorrect.",
          },
          { status: 400 },
        );
      }

      if (inviteToken.used) {
        return Response.json(
          {
            success: false,
            message:
              "This invite has already been accepted. If you're a member, just log in to continue.",
          },
          { status: 400 },
        );
      }

      if (inviteToken.expiresAt < new Date()) {
        return Response.json(
          {
            success: false,
            message:
              "This invite has expired. Ask whoever invited you to send a new one.",
          },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashPassword,
            name,
            emailVerified: true,
          },
        });

        await tx.workspaceMember.create({
          data: {
            userId: newUser.id,
            workspaceId: inviteToken.workspaceId,
            role: inviteToken.role,
          },
        });

        await tx.inviteToken.update({
          where: { id: inviteToken.id },
          data: { used: true },
        });
      });
    } else {
      const newUser = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashPassword,
            name,
          },
        });

        const newWorkspace = await tx.workspace.create({
          data: {
            name: newUser.name?.concat(" workspace") || "My Workspace",
            ownerId: newUser.id,
          },
        });

        await tx.workspaceMember.create({
          data: {
            userId: newUser.id,
            workspaceId: newWorkspace.id,
            role: "OWNER",
          },
        });
        return newUser;
      });

      const emailResponse = await sendVerificationEmail(
        newUser.name || "there",
        newUser.email,
        newUser.id,
      );

      if (!emailResponse.success) {
        return Response.json(
          {
            success: false,
            message: emailResponse.message,
          },
          { status: 500 },
        );
      }
    }

    if (token) {
      return Response.json({
        success: true,
        message:
          "Account created! You've joined the workspace you were invited to.",
      });
    } else {
      return Response.json({
        success: true,
        message: "Account created! Check your email to verify and get started.",
      });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return Response.json(
      {
        success: false,
        message:
          "Something went wrong while creating your account. Please try again.",
      },
      { status: 500 },
    );
  }
}
