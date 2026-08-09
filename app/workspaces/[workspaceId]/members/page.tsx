import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InviteMemberForm } from "@/components/InviteMemberForm";
import { RevokeInviteButton } from "@/components/RevokeInviteButton";
import { RemoveMemberButton } from "@/components/RemoveMemberButton";
import { Clock } from "lucide-react";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!requesterMembership) {
    redirect("/no-workspace");
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { name: true, email: true } } },
  });

  const pendingInvites = await prisma.inviteToken.findMany({
    where: { workspaceId, used: false },
  });

  const canInvite =
    requesterMembership.role === "OWNER" ||
    requesterMembership.role === "ADMIN";

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-medium text-stone-900 tracking-tight">
            Members
          </h1>
          <p className="text-[13px] text-stone-400 mt-1">
            {members.length}{" "}
            {members.length === 1 ? "person has" : "people have"} access to this
            workspace.
          </p>
        </header>

        <section className="bg-white border border-stone-200 rounded-xl overflow-hidden mb-6">
          {members.map((member, i) => (
            <div
              key={member.id}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i !== members.length - 1 ? "border-b border-stone-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
                  <span className="text-orange-500 text-xs font-medium">
                    {member.user.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="text-[13.5px] font-medium text-stone-900">
                    {member.user.name}
                  </p>
                  <p className="text-[12px] text-stone-400">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-stone-500 bg-stone-100 rounded-full px-2.5 py-1">
                  {member.role}
                </span>
                {canInvite &&
                  member.role !== "OWNER" &&
                  member.userId !== session.user.id && (
                    <RemoveMemberButton
                      workspaceId={workspaceId}
                      memberId={member.id}
                    />
                  )}
              </div>
            </div>
          ))}
        </section>

        {pendingInvites.length > 0 && (
          <section className="mb-6">
            <p className="text-[12px] font-medium text-stone-400 uppercase tracking-wide mb-2 px-1">
              Pending invites
            </p>
            <div className="bg-white border border-dashed border-stone-300 rounded-xl overflow-hidden">
              {pendingInvites.map((invite, i) => (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between px-5 py-3 ${
                    i !== pendingInvites.length - 1
                      ? "border-b border-stone-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="text-stone-300" size={14} />
                    <span className="text-[13px] text-stone-600">
                      {invite.email}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    invited as {invite.role.toLowerCase()}
                  </span>
                  {canInvite && (
                    <RevokeInviteButton
                      workspaceId={workspaceId}
                      inviteId={invite.id}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {canInvite && (
          <section className="bg-white border border-stone-200 rounded-xl px-6 py-5">
            <p className="text-[13.5px] font-medium text-stone-900 mb-4">
              Invite someone new
            </p>
            <InviteMemberForm workspaceId={workspaceId} />
          </section>
        )}
      </div>
    </div>
  );
}
