import { prisma } from "@/lib/prisma";

export async function isSoleOwner(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const ownerCount = await prisma.workspaceMember.count({
    where: { role: "OWNER", workspaceId },
  });

  if (ownerCount !== 1) {
    return false;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  return membership?.role === "OWNER";
}
