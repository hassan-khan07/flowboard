import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UpgradeButton from "@/components/UpgradeButton";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    redirect("/no-workspace");
  }

  return (
    <div className="min-h-screen bg-stone-950 p-8 text-stone-50">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="mt-2 text-stone-400">
        Current plan:{" "}
        <span className="font-medium text-orange-500">{workspace.plan}</span>
      </p>

      {workspace.plan === "FREE" && (
        <div className="mt-6">
          <UpgradeButton workspaceId={workspaceId} />
        </div>
      )}
    </div>
  );
}
