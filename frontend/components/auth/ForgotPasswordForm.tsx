"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "./StepIndicator";
import { StepTransition } from "./StepTransition";
import { OtpStep } from "./OTPStep";

const STEPS = ["Email", "Verify", "Reset"];

export function ForgotPasswordForm() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "reset" }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setStep(1);
    } catch {
      setError("Couldn't find an account with that email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Couldn't reset your password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted-foreground">
          Your password has been reset. You can log in with your new password now.
        </p>
        <Button asChild className="w-full rounded-full" size="lg">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={STEPS} current={step} />

      <StepTransition stepKey={step}>
        {step === 0 && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ash@pokepedia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll send a 6-digit code to confirm it's you.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Sending code..." : "Send code"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        )}

        {step === 1 && (
          <OtpStep email={email} onVerified={() => setStep(2)} onBack={() => setStep(0)} />
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" minLength={8} required />
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        )}
      </StepTransition>
    </div>
  );
}