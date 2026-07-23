import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  SquareKanban,
  Home,
  Folder,
  Users,
  Settings,
  Plus,
  Sparkles,
  ChevronsUpDown,
  Search,
  ListChecks,
  Rocket,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.id) {
    redirect("/login");
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: {
          name: true,
          plan: true,
        },
      },
    },
  });

  if (!workspaceMember) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
  });

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId: workspaceMember.workspaceId },
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-[210px] border-r border-stone-200 flex flex-col py-5 shrink-0">
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

        {/* Workspace switcher */}
        <div className="px-3 pb-3">
          <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 transition-colors cursor-pointer">
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
            <ChevronsUpDown className="text-stone-400" size={13} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 flex flex-col gap-px">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] bg-stone-200/60"
          >
            <Home className="text-stone-900" size={15} />
            <span className="text-stone-900 text-[13px] font-medium">Home</span>
          </a>

          <a
            href="#"
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <Folder className="text-stone-500" size={15} />
            <span className="text-stone-500 text-[13px]">Projects</span>
          </a>

          <a
            href="#"
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
            href="#"
            className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] hover:bg-stone-100 transition-colors"
          >
            <Settings className="text-stone-500" size={15} />
            <span className="text-stone-500 text-[13px]">Settings</span>
          </a>
        </nav>

        {/* Plan card */}
        {workspaceMember.workspace.plan === "FREE" && (
          <div className="mt-auto mx-3 p-3 rounded-[10px] bg-stone-900">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="text-orange-500" size={14} />
              <span className="text-stone-50 text-xs font-medium">
                Free plan
              </span>
            </div>
            <p className="text-stone-400 text-[11px] leading-normal mb-2.5">
              Unlimited projects. Upgrade for more members.
            </p>
            <button className="w-full h-7 bg-orange-500 hover:bg-orange-400 rounded-md transition-colors cursor-pointer">
              <span className="text-stone-900 text-[11.5px] font-medium">
                Upgrade to Pro
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
            <button className="h-[34px] px-3.5 bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
              <Plus className="text-orange-500" size={15} />
              <span className="text-stone-50 text-[13px] font-medium">
                New project
              </span>
            </button>
          </div>
        </header>

        <div className="px-8 py-6 flex flex-col gap-6">
          {/* Stat cards */}
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

          {/* Projects section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-medium text-stone-900">Projects</p>
              {projects.length > 0 && (
                <span className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                  View all
                </span>
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
                <button className="h-9 px-4 bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus className="text-orange-500" size={15} />
                  <span className="text-stone-50 text-[13px] font-medium">
                    Create project
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-5 py-4 cursor-pointer transition-colors"
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
