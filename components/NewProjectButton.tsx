"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Folder, X, Loader2 } from "lucide-react";

export default function NewProjectButton({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const closeModal = () => {
    setIsOpen(false);
    setName("");
    setError(null);
  };

  const handleCreate = async () => {
    if (name.trim() === "") {
      setError("Give your project a name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

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
        className="h-[34px] px-3.5 bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Plus className="text-orange-500" size={15} />
        <span className="text-stone-50 text-[13px] font-medium">
          New project
        </span>
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
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Folder className="text-orange-500" size={18} />
              </div>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="text-[17px] font-medium text-stone-900 mb-1">
              New project
            </h2>
            <p className="text-[13px] text-stone-400 mb-4">
              Give your project a name to get started.
            </p>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Website Redesign"
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
                {loading ? "Creating..." : "Create project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
