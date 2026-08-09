"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema } from "@/schemas/inviteSchema";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import * as z from "zod";
import type { ApiResponse } from "@/types/apiResponse";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof inviteSchema>;

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });
  const router = useRouter();
  const onSubmit = async (data: FormData) => {
    try {
      await axios.post(`/api/workspaces/${workspaceId}/invite`, data);
      toast.success("Invite sent");
      reset();
      router.refresh();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message ?? "Failed to send invite");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-medium text-stone-700">
                Email
              </FieldLabel>
              <Input
                {...field}
                type="email"
                placeholder="teammate@company.com"
                className="h-10 rounded-[9px] border-stone-200 bg-white text-[13px] placeholder:text-stone-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/15 focus-visible:ring-[3px]"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="role"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-medium text-stone-700">
                Role
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 rounded-[9px] border-stone-200 bg-white text-[13px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 h-[42px] w-fit px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 rounded-[9px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <span className="text-stone-50 text-sm font-medium">
          {isSubmitting ? "Sending..." : "Send invite"}
        </span>
        {!isSubmitting && <ArrowRight className="text-orange-500" size={16} />}
      </button>
    </form>
  );
}
