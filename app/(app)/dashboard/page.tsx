import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!workspaceMember) {
    redirect("/no-workspace");
  }

  redirect(`/workspaces/${workspaceMember.workspaceId}`);
}
