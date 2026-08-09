"use client";

import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ApiResponse } from "@/types/apiResponse";

export function RevokeInviteButton({
  workspaceId,
  inviteId,
}: {
  workspaceId: string;
  inviteId: string;
}) {
  const router = useRouter();

  const handleRevoke = async () => {
    try {
      await axios.delete(`/api/workspaces/${workspaceId}/invite/${inviteId}`);
      toast.success("Invite revoked");
      router.refresh();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ?? "Failed to revoke invite",
      );
    }
  };

  return (
    <button
      onClick={handleRevoke}
      className="text-[11px] font-medium text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
    >
      Revoke
    </button>
  );
}
