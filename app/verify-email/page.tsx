import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        This verification link looks incomplete. Please check the link and try
        again.
      </div>
    );
  }

  const emailVerificationToken = await prisma.emailVerificationToken.findUnique(
    {
      where: { token },
      include: { user: true },
    },
  );

  if (!emailVerificationToken) {
    return (
      <div>
        We couldn't find this verification link. It may have already been used
        or the link is incorrect.
      </div>
    );
  }

  if (emailVerificationToken.used) {
    return <div>This email is already verified. You can log in anytime.</div>;
  }

  if (emailVerificationToken.expiresAt < new Date()) {
    return (
      <div>
        This verification link has expired. Log in to request a new one.
      </div>
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
