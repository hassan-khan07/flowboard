import { auth } from "@/auth";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST() {
  // it reads the session via auth() (identifying the user from their cookie critically, not from anything the client sends, so nobody can trigger emails for other users by faking a request body);
  const session = await auth();

  if (!session?.user) {
    return Response.json(
      { success: false, message: "Not logged in" },
      { status: 401 },
    );
  }

  if (session.user.isVerified) {
    return Response.json(
      { success: false, message: "Email already verified" },
      { status: 400 },
    );
  }

  const emailResponse = await sendVerificationEmail(
    session.user.name || "there",
    session.user.email as string,
    session.user.id,
  );

  if (!emailResponse.success) {
    return Response.json(
      { success: false, message: emailResponse.message },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    message: "Verification email resent successfully.",
  });
}
