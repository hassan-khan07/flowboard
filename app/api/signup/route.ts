import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/schemas/signUpSchema";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
          message: "Email already in use",
        },
        { status: 400 },
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

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

    return Response.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return Response.json(
      {
        success: false,
        message: "Error registering user",
      },
      { status: 500 },
    );
  }
}
