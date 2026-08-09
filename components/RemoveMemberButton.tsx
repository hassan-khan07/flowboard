"use client";

import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ApiResponse } from "@/types/apiResponse";

export function RemoveMemberButton({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}) {
  const router = useRouter();

  const handleRemove = async () => {
    try {
      await axios.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
      toast.success("Member removed");
      router.refresh();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ?? "Failed to remove member",
      );
    }
  };

  return (
    <button
      onClick={handleRemove}
      className="text-[11px] font-medium text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
    >
      Remove
    </button>
  );
}
