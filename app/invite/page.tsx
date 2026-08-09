import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        This invite link looks incomplete. Please check the link and try again.
      </div>
    );
  }

  const invite = await prisma.inviteToken.findFirst({
    where: { token },
  });

  if (!invite) {
    return (
      <div>
        We couldn't find this invite. It may have been revoked, or the link may
        be incorrect.
      </div>
    );
  }

  if (invite.used) {
    return (
      <div>
        This invite has already been accepted. If you're a member, just log in
        to continue.
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div>
        This invite has expired. Ask whoever invited you to send a new one.
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      // <div>
      //   You've been invited to join as {invite.role}. Sign in or create an
      //   account with {invite.email} to accept.
      // </div>
      redirect(`/signup?token=${token}&email=${invite.email}`)
    );
  }

  if (session.user.email !== invite.email) {
    return (
      <div>
        This invite was sent to {invite.email}, but you're signed in as{" "}
        {session.user.email}. Log out and sign back in with the invited account
        to continue.
      </div>
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.create({
      data: {
        role: invite.role,
        userId: session.user.id,
        workspaceId: invite.workspaceId,
      },
    });

    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { used: true },
    });
  });

  redirect("/dashboard");
}
