import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import {
  SquareKanban,
  Home,
  Folder,
  Users,
  Settings,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react";
import UpgradeButton from "@/components/UpgradeButton";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
    include: {
      workspace: {
        select: { name: true, plan: true },
      },
    },
  });

  if (!workspaceMember) {
    redirect("/no-workspace");
  }

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="w-[210px] border-r border-stone-200 flex flex-col py-5 shrink-0 h-screen sticky top-0">
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] bg-orange-500 rounded-[7px] flex items-center justify-center -rotate-6">
              <SquareKanban className="text-white" size={14} />
            </div>
            <span className="text-stone-900 text-[15px] font-medium tracking-tight">
              FlowBoard
            </span>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border border-stone-200 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[5px] bg-stone-900 flex items-center justify-center">
                <span className="text-orange-500 text-[10px] font-medium">
                  {workspaceMember.workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-stone-700 text-[12.5px] font-medium truncate max-w-[110px]">
                {workspaceMember.workspace.name}
              </span>
            </div>
            <ChevronsUpDown className="text-stone-300" size={13} />
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-px">
          <a
            href={`/workspaces/${workspaceId}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <Home className="text-stone-500" size={15} />
            <span className="text-stone-500 text-[13px]">Home</span>
          </a>

          <a
            href={`/workspaces/${workspaceId}/projects`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <Folder className="text-stone-500" size={15} />
            <span className="text-stone-500 text-[13px]">Projects</span>
          </a>

          <a
            href={`/workspaces/${workspaceId}/members`}
            className="flex items-center justify-between px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="text-stone-500" size={15} />
              <span className="text-stone-500 text-[13px]">Members</span>
            </div>
            <span className="text-[10px] text-stone-500 bg-stone-200 rounded-full px-2 py-px">
              {memberCount}
            </span>
          </a>

          <a
            href={`/workspaces/${workspaceId}/billing`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <Settings className="text-stone-500" size={15} />
            <span className="text-stone-500 text-[13px]">Settings</span>
          </a>
        </nav>

        {workspaceMember.workspace.plan === "FREE" ? (
          <div className="mx-3 p-3 rounded-[10px] bg-stone-900 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="text-orange-500" size={14} />
              <span className="text-stone-50 text-xs font-medium">
                Free plan
              </span>
            </div>
            <p className="text-stone-400 text-[11px] leading-normal mb-2.5">
              1 project, 3 members. Upgrade for unlimited.
            </p>
            <UpgradeButton workspaceId={workspaceId} />
          </div>
        ) : (
          <div className="mx-3 p-3 rounded-[10px] bg-stone-900 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-orange-500" size={14} />
              <span className="text-stone-50 text-xs font-medium">
                Pro plan
              </span>
            </div>
            <p className="text-stone-400 text-[11px] leading-normal mt-1">
              Unlimited projects and members.
            </p>
          </div>
        )}

        <div className="mt-auto px-3 pt-3 border-t border-stone-200">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
    </div>
  );
}