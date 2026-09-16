"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";

export default function NewTaskButton({
  workspaceId,
  projectId,
  status,
  statusLabel,
}: {
  workspaceId: string;
  projectId: string;
  status: string;
  statusLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const closeModal = () => {
    setIsOpen(false);
    setTitle("");
    setError(null);
  };

  const handleCreate = async () => {
    if (title.trim() === "") {
      setError("Give the task a title.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, status, priority: "MEDIUM" }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      closeModal();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:text-orange-400 hover:border-orange-500/50 hover:bg-stone-800/50 transition-colors cursor-pointer text-[12.5px]"
      >
        <Plus size={14} />
        Add task
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[17px] font-medium text-stone-900">
                  New task
                </h2>
                <p className="text-[13px] text-stone-400 mt-0.5">
                  Adding to{" "}
                  <span className="text-orange-500 font-medium">
                    {statusLabel}
                  </span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Fix login bug"
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
            />

            {error && (
              <p className="text-[12.5px] text-red-500 mt-2">{error}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 h-9 rounded-lg border border-stone-200 text-stone-600 text-[13px] font-medium hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                {loading ? "Adding..." : "Add task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
