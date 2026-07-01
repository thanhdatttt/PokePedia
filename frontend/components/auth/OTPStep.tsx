"use client";

import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export function OtpStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      // TODO: replace with verify otp api
      onVerified();
    } catch {
      setError("That code didn't work. Check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    // TODO: replace with resend otp api
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) clearInterval(interval);
        return s - 1;
      });
    }, 1000);
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <Button
        className="w-full rounded-full"
        size="lg"
        disabled={otp.length !== 6 || loading}
        onClick={handleVerify}
      >
        {loading ? "Verifying..." : "Verify"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          Back
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}