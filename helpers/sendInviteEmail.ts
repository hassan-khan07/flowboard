import { Resend } from "resend";
import InviteEmail from "@/emails/InviteEmail";

export async function sendInviteEmail(
  workspaceName: string,
  email: string,
  role: string,
  token: string,
) {
  try {
    const inviteUrl = `${process.env.APP_URL}/invite?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendResult = await resend.emails.send({
      from: "FlowBoard <verify@hassankhan07.dev>",
      to: email,
      subject: `You've been invited to join ${workspaceName} on FlowBoard`,
      react: InviteEmail({ workspaceName, role, inviteUrl }),
    });

    if (sendResult.error) {
      return { success: false, message: sendResult.error.message };
    }

    return { success: true, message: "Invite email sent successfully." };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return { success: false, message: "Failed to send invite email" };
  }
}