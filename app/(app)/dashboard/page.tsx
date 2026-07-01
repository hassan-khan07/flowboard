import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.id) {
    redirect("/login");
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user.id },
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

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{workspaceMember.workspace.name}</p>
      <p>Plan: {workspaceMember.workspace.plan}</p>
      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        projects.map((project) => <div key={project.id}>{project.name}</div>)
      )}
    </div>
  );
}
