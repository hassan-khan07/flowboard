"use client";
import { Task } from "@prisma/client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import TaskCard from "@/components/TaskCard";
import NewTaskButton from "@/components/NewTaskButton";
import { TaskWithModifier } from "@/types/task";

type KanbanColumnProps = {
  status: string;
  label: string;
  tasks: TaskWithModifier[];
  workspaceId: string;
  projectId: string;
};

const COLUMN_ACCENTS: Record<string, string> = {
  TODO: "border-t-stone-600",
  IN_PROGRESS: "border-t-orange-500/60",
  DONE: "border-t-emerald-500/60",
};

export default function KanbanColumn({
  status,
  label,
  tasks,
  workspaceId,
  projectId,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const taskIds = tasks.map((task) => task.id);
  const accent = COLUMN_ACCENTS[status] ?? "border-t-stone-600";

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border-t-2 bg-stone-900 p-3 min-h-[420px] ${accent}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-stone-200">{label}</h2>
        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              isDone={status === "DONE"}
            />
          ))}

          {tasks.length === 0 && (
            <p className="px-1 text-xs text-stone-500">No tasks yet</p>
          )}

          <NewTaskButton
            workspaceId={workspaceId}
            projectId={projectId}
            status={status}
            statusLabel={label}
          />
        </div>
      </SortableContext>
    </div>
  );
}
