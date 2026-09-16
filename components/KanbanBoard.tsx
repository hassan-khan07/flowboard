"use client";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Task } from "@prisma/client";
import { TASK_STATUSES } from "@/schemas/taskSchema";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import KanbanColumn from "@/components/KanbanColumn";
import { useRouter } from "next/navigation";
import { TaskWithModifier } from "@/types/task";

type KanbanBoardProps = {
  tasks: TaskWithModifier[];
  workspaceId: string;
  projectId: string;
};

const STATUS_LABELS: Record<(typeof TASK_STATUSES)[number], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export default function KanbanBoard({
  tasks,
  workspaceId,
  projectId,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    socketRef.current = io("http://localhost:4000");
    socketRef.current.on(
      "task-moved",
      (data: { taskId: string; newStatus: string }) => {
        setLocalTasks((prev) =>
          prev.map((task) =>
            task.id === data.taskId
              ? { ...task, status: data.newStatus }
              : task,
          ),
        );
      },
    );
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeTask = localTasks.find((task) => task.id === active.id);
    if (!activeTask) return;

    const overTask = localTasks.find((task) => task.id === over.id);
    const newStatus = overTask ? overTask.status : (over.id as string);

    if (activeTask.status === newStatus) return;

    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === activeTask.id ? { ...task, status: newStatus } : task,
      ),
    );

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${activeTask.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        setLocalTasks((prev) =>
          prev.map((task) =>
            task.id === activeTask.id
              ? { ...task, status: activeTask.status }
              : task,
          ),
        );
      } else {
        socketRef.current?.emit("task-moved", {
          taskId: activeTask.id,
          newStatus,
        });
        router.refresh();
      }
    } catch (error) {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === activeTask.id
            ? { ...task, status: activeTask.status }
            : task,
        ),
      );
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-6">
        {TASK_STATUSES.map((status) => {
          const columnTasks = localTasks.filter(
            (task) => task.status === status,
          );

          return (
            <KanbanColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              tasks={columnTasks}
              workspaceId={workspaceId}
              projectId={projectId}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
