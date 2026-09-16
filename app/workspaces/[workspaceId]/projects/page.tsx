import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Folder } from "lucide-react";
import NewProjectButton from "@/components/NewProjectButton";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!membership) {
    redirect("/no-workspace");
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-full p-8 bg-orange-50/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-stone-900 tracking-tight">
            Projects
          </h1>
          <p className="text-[13px] text-stone-400 mt-0.5">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <NewProjectButton workspaceId={workspaceId} />
      </div>

      {projects.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-stone-300 rounded-[14px] px-8 py-11 flex flex-col items-center text-center bg-white">
          <div className="w-11 h-14 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center mb-4">
            <Folder className="text-orange-500" size={18} />
          </div>
          <p className="text-[15px] font-medium text-stone-900 mb-1">
            No projects yet
          </p>
          <p className="text-[13px] text-stone-400 max-w-[280px]">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/workspaces/${workspaceId}/projects/${project.id}`}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-5 py-4 transition-colors"
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
