import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <div>Invalid verification link. No token provided.</div>;
  }

  const emailVerificationToken = await prisma.emailVerificationToken.findUnique(
    {
      where: { token },
      include: { user: true },
    },
  );

  if (!emailVerificationToken) {
    return <div>Invalid or expired verification link.</div>;
  }

  if (emailVerificationToken.used) {
    return (
      <div>
        This link has already been used. Your email may already be verified —
        try logging in.
      </div>
    );
  }

  if (emailVerificationToken.expiresAt < new Date()) {
    return (
      <div>This verification link has expired. Please request a new one.</div>
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: emailVerificationToken.userId },
      data: { emailVerified: true },
    });

    await tx.emailVerificationToken.update({
      where: { id: emailVerificationToken.id },
      data: { used: true },
    });
  });

  redirect("/login?verified=true");
}
