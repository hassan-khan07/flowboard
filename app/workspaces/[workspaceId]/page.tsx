import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewProjectButton from "@/components/NewProjectButton";
import {
  SquareKanban,
  Folder,
  Users,
  Plus,
  Search,
  ListChecks,
  Rocket,
} from "lucide-react";

export default async function WorkspaceHomePage({
  params,
}: {
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

  const projects = await prisma.project.findMany({
    where: { workspaceId },
  });

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <header className="px-8 pt-6 flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 mb-0.5">{today}</p>
          <h1 className="text-2xl font-medium text-stone-900 tracking-tight">
            Salam, {firstName} <span className="text-orange-500">·</span>{" "}
            let&apos;s flow
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-[34px] h-[34px] rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer">
            <Search className="text-stone-500" size={16} />
          </button>
          <NewProjectButton workspaceId={workspaceId} />
        </div>
      </header>

      <div className="px-8 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-3">
          <div className="relative overflow-hidden bg-stone-900 rounded-xl px-5 py-4">
            <div className="absolute -right-3 -bottom-3 w-[70px] h-[70px] rounded-full bg-orange-500/15" />
            <p className="text-xs text-stone-400 mb-1.5">Workspace</p>
            <p className="text-[17px] font-medium text-stone-50 mb-0.5 truncate">
              {workspaceMember.workspace.name}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-[3px] rounded-full bg-orange-500/15">
              <span className="w-[5px] h-[5px] rounded-full bg-orange-500" />
              <span className="text-[11px] text-orange-300 font-medium">
                {workspaceMember.workspace.plan === "FREE"
                  ? "Free plan"
                  : "Pro plan"}
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Folder className="text-stone-400" size={14} />
              <p className="text-xs text-stone-400">Projects</p>
            </div>
            <p className="text-[26px] font-medium text-stone-900">
              {projects.length}
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users className="text-stone-400" size={14} />
              <p className="text-xs text-stone-400">Members</p>
            </div>
            <p className="text-[26px] font-medium text-stone-900">
              {memberCount}
            </p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-medium text-stone-900">Projects</p>
            {projects.length > 0 && (
              <a
                href={`/workspaces/${workspaceId}/projects`}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                View all
              </a>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-stone-300 rounded-[14px] px-8 py-11 flex flex-col items-center text-center bg-white">
              <div className="flex gap-2 mb-4">
                <div className="w-11 h-14 bg-amber-100 rounded-lg -rotate-[8deg] flex items-center justify-center">
                  <ListChecks className="text-amber-600" size={18} />
                </div>
                <div className="w-11 h-14 bg-orange-100 border border-orange-200 rounded-lg -mt-1.5 flex items-center justify-center">
                  <SquareKanban className="text-orange-500" size={18} />
                </div>
                <div className="w-11 h-14 bg-sky-100 rounded-lg rotate-[8deg] flex items-center justify-center">
                  <Rocket className="text-sky-600" size={18} />
                </div>
              </div>
              <p className="text-[15px] font-medium text-stone-900 mb-1">
                Your board is waiting
              </p>
              <p className="text-[13px] text-stone-400 mb-4 max-w-[280px]">
                Create your first project and give your team&apos;s work a
                home.
              </p>
              <NewProjectButton workspaceId={workspaceId} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={`/workspaces/${workspaceId}/projects/${project.id}`}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-5 py-4 cursor-pointer transition-colors block"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <Folder className="text-orange-500" size={16} />
                  </div>
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Created{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}