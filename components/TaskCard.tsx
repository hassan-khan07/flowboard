"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TASK_PRIORITIES } from "@/schemas/taskSchema";
import { formatDistanceToNow } from "date-fns";
import { Pencil, X, Trash2, Loader2, History } from "lucide-react";

type TaskWithModifier = Prisma.TaskGetPayload<{
  include: { lastModifier: { select: { name: true } } };
}>;

type TaskCardProps = {
  task: TaskWithModifier;
  workspaceId: string;
  projectId: string;
  isDone?: boolean;
};

const PRIORITY_STYLES: Record<string, { dot: string; label: string }> = {
  HIGH: { dot: "bg-red-500", label: "High" },
  MEDIUM: { dot: "bg-orange-500", label: "Medium" },
  LOW: { dot: "bg-stone-500", label: "Low" },
};

export default function TaskCard({
  task,
  workspaceId,
  projectId,
  isDone = false,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const apiUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`;

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(task.title);
    setEditPriority(task.priority);
    setError(null);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    if (title.trim() === "") {
      setError("Title can't be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: editPriority }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      closeEdit();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      closeEdit();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative select-none rounded-lg border p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing ${
          isDone
            ? "border-emerald-800/40 bg-stone-800/60"
            : "border-stone-700/50 bg-stone-800 hover:border-orange-500/40"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priority.dot}`}
            title={`${priority.label} priority`}
          />
          <div className="flex-1 pr-5">
            <p
              className={`text-sm leading-snug ${isDone ? "text-stone-400 line-through decoration-stone-600" : "text-stone-100"}`}
            >
              {task.title}
            </p>
            {task.lastModifier && task.lastModifiedAt && (
              <p className="text-[10.5px] text-stone-500 mt-1">
                Updated by {task.lastModifier.name} ·{" "}
                {formatDistanceToNow(new Date(task.lastModifiedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={openEdit}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-500 hover:text-orange-400 transition-opacity cursor-pointer"
        >
          <Pencil size={13} />
        </button>
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm px-4"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-[17px] font-medium text-stone-900">
                Edit task
              </h2>
              <button
                onClick={closeEdit}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <label className="text-[12px] font-medium text-stone-500 mb-1 block">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[14px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors mb-3"
            />

            <label className="text-[12px] font-medium text-stone-500 mb-1 block">
              Priority
            </label>
            <div className="flex gap-2 mb-4">
              {TASK_PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setEditPriority(p)}
                  className={`flex-1 h-9 rounded-lg text-[12.5px] font-medium border transition-colors cursor-pointer ${
                    editPriority === p
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-stone-200 text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  {PRIORITY_STYLES[p].label}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-[12.5px] text-red-500 mb-2">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="h-9 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={closeEdit}
                className="flex-1 h-9 rounded-lg border border-stone-200 text-stone-600 text-[13px] font-medium hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
