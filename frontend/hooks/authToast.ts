"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

export function useAuthToasts() {
  const message = useAuthStore((s) => s.message);
  const clearMessage = useAuthStore((s) => s.clearMessage);
  // const error = useAuthStore((s) => s.error);
  // const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    if (message) {
      toast.success(message);
      clearMessage();
    }
  }, [message, clearMessage]);

  // useEffect(() => {
  //   if (error) {
  //     toast.error(error);
  //     clearError();
  //   }
  // }, [error, clearError]);
}
