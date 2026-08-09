import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ResendVerificationButton } from "@/components/ResendVerificationButton";

export default async function VerifyEmailPendingPage() {
  const session = await auth();

  if (session?.user?.isVerified) {
    redirect("/dashboard");
  }

  return (
    <div>
      <p>Almost there — check your inbox to confirm your email address.</p>
      <p>We sent a link to {session?.user?.email}.</p>
      <ResendVerificationButton />
    </div>
  );
}
