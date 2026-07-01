"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "./StepIndicator";
import { StepTransition } from "./StepTransition";
import { OtpStep } from "./OTPStep";

const STEPS = ["Email", "Verify", "Details"];

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 0: email
  async function handleEmailSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // TODO: replace with send otp api
      setStep(1);
    } catch {
      setError("Couldn't send a code to that address. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: details
  async function handleDetailsSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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
      // TODO: replace with register api
      window.location.href = "/login";
    } catch {
      setError("Something went wrong creating your account.");
    } finally {
      setLoading(false);
    }
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
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Sending code..." : "Continue"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
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
          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Ash Ketchum" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}
      </StepTransition>
    </div>
  );
}