import { toast } from "sonner";

export function getErrorMessage(err: any, fallback = "Something went wrong"): string {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  if (typeof message === "string") return message;
  return fallback;
}

export function showApiError(err: unknown, fallback?: string) {
  toast.error(getErrorMessage(err, fallback));
}
