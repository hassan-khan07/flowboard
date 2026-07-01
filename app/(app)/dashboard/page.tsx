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

  return (
    <div>
      <h1>Dashboard</h1>
      {workspaceMember?.workspace?.name}
      {workspaceMember?.workspace?.plan}
    </div>
  );
}
