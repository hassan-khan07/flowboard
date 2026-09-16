// types/task.ts
import { Prisma } from "@prisma/client";

export type TaskWithModifier = Prisma.TaskGetPayload<{
  include: { lastModifier: { select: { name: true } } };
}>;