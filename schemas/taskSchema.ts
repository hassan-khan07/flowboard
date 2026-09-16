import * as z from "zod";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const taskSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    message: "Please select a status",
  }),

  priority: z.enum(TASK_PRIORITIES, {
    message: "please select priority level",
  }),

  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters"),

  description: z.string().max(2000, "Description is too long").optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional(),
});

export const updateTaskSchema = taskSchema.partial();
