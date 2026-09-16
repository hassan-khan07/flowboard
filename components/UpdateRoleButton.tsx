"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function UpdateRoleButton({
  workspaceId,
  memberId,
  currentRole,
}: {
  workspaceId: string;
  memberId: string;
  currentRole: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <select
      value={currentRole}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="text-[11px] font-medium text-stone-500 bg-stone-100 rounded-full px-2.5 py-1 border-none cursor-pointer disabled:opacity-50"
    >
      <option value="MEMBER">MEMBER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
