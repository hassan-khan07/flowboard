import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import VerificationEmail from "@/emails/VerificationEmail";

export async function sendVerificationEmail(
  name: string,
  email: string,
  userId: string,
) {
  try {
    const randomToken = crypto.randomBytes(32).toString("hex");
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${randomToken}`;

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.emailVerificationToken.upsert({
      where: { userId: userId },
      update: { token: randomToken, expiresAt: expiresAt, used: false },
      create: { userId: userId, token: randomToken, expiresAt: expiresAt },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendResult = await resend.emails.send({
      from: "FlowBoard <verify@hassankhan07.dev>",
      to: email,
      subject: "FLow Board Verification Email",
      react: VerificationEmail({ name, verificationUrl }),
    });

    if (sendResult.error) {
      // console.error("Resend error:", sendResult.error);
      return { success: false, message: sendResult.error.message };
    }

    return { success: true, message: "Verification email sent successfully." };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, message: "Failed to send verification email" };
  }
}
