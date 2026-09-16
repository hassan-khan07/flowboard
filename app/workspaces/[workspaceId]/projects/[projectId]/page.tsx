import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import { ArrowLeft, SquareKanban } from "lucide-react";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const requesterMembership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!requesterMembership) {
    redirect("/no-workspace");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    redirect(`/workspaces/${workspaceId}/projects`);
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: { lastModifier: { select: { name: true } } },
  });
  return (
    <div
      className="min-h-full"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(120,113,108,0.15) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <header className="px-8 pt-6 pb-4">
        <a
          href={`/workspaces/${workspaceId}/projects`}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-stone-400 hover:text-stone-600 transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          All projects
        </a>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <SquareKanban className="text-orange-500" size={16} />
          </div>
          <h1 className="text-2xl font-medium text-stone-900 tracking-tight">
            {project.name}
          </h1>
        </div>
        <p className="text-[13px] text-stone-400 mt-1 ml-[42px]">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>
      </header>

      <KanbanBoard
        tasks={tasks}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}
