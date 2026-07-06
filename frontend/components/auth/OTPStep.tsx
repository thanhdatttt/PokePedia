"use client";

import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { Error } from "../util/Error";
import { otpSchema } from "@/lib/validations/auth.schema";
import { showApiError } from "@/lib/toast";

export function OtpStep({
  email,
  type,
  onVerified,
  onBack,
}: {
  email: string;
  type: string,
  onVerified: () => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const verifyOTP = useAuthStore((state) => state.verifyOTP);
  const sendOTP = useAuthStore((state) => state.sendOTP);

  async function handleVerify() {
    const result = otpSchema.safeParse({ otp });
    if (!result.success) return; // button is disabled until 6 digits anyway

    setLoading(true);
    try {
      await verifyOTP(email, result.data.otp, type);
      onVerified();
    } catch (err) {
      showApiError(err, "Incorrect or expired OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await sendOTP(email, type);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) clearInterval(interval);
          return s - 1;
        });
      }, 1000);
    } catch {
      // toasted globally
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-base text-muted-foreground">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-foreground">
          {email}
        </span>
      </p>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-12 rounded-xl text-lg font-semibold"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        className="h-12 w-full rounded-full text-base font-semibold"
        size="lg"
        disabled={otp.length !== 6 || loading}
        onClick={handleVerify}
      >
        {loading ? "Verifying..." : "Verify"}
      </Button>

      <div className="flex items-center justify-between text-base">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-medium text-primary transition-colors hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend code"}
        </button>
      </div>
    </div>
  );
}