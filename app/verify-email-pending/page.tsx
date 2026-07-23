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
      <p>Please check your inbox to confirm your email.</p>
      <p>{`A verification email was sent to ${session?.user?.email}.`}</p>
      <ResendVerificationButton />
    </div>
  );
}
