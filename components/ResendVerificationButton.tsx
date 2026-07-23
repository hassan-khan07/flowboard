"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/resend-verification");
      toast.success(response.data.message);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to resend email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleResend} disabled={isLoading}>
      {isLoading ? "Sending..." : "Resend verification email"}
    </Button>
  );
}
