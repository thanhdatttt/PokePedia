"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { StepTransition } from "./StepTransition";
import { OtpStep } from "./OTPStep";
import { Error } from "../util/Error";
import { emailStepSchema, fieldErrorsFrom, resetPasswordSchema } from "@/lib/validations/auth.schema";
import { showApiError } from "@/lib/toast";

const STEPS = ["Email", "Verify", "Reset"];

export function ForgotPasswordForm() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const resetPassword = useAuthStore((state) => state.resetPassword);
  const sendOTP = useAuthStore((state) => state.sendOTP);
  const isLoading = useAuthStore((state) => state.isLoading);

  async function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const result = emailStepSchema.safeParse({ email });
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }

    setStepLoading(true);
    try {
      await sendOTP(result.data.email, "RESET");
      setStep(1);
    } catch (err) {
      
    } finally {
      setStepLoading(false);
    }
  }

  async function handleResetSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const input = {
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = resetPasswordSchema.safeParse(input);
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }

    try {
      await resetPassword(email, result.data.newPassword);
      setDone(true);
    } catch (err) {
      
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
    <div className="space-y-8">
      <StepIndicator steps={STEPS} current={step} />

      <StepTransition stepKey={step}>
        {step === 0 && (
          <form onSubmit={handleEmailSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="ash@pokepedia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl text-base"
              />

              <p className="text-sm text-muted-foreground">
                We'll send a 6-digit verification code to confirm it's you.
              </p>

              {fieldErrors.email && <Error error={fieldErrors.email} />}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-semibold"
              size="lg"
              disabled={stepLoading}
            >
              {stepLoading ? "Sending code..." : "Send code"}
            </Button>

            <p className="text-center text-base text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary transition-colors hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        )}

        {step === 1 && (
          <OtpStep
            email={email}
            type="RESET"
            onVerified={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-base font-medium">
                New Password
              </Label>

              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 rounded-xl text-base"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                At least 8 characters with uppercase, numbers, and symbols.
              </p>
              
              {fieldErrors.newPassword && <Error error={fieldErrors.newPassword} />}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-base font-medium"
              >
                Confirm New Password
              </Label>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 rounded-xl text-base"
              />
              
              {fieldErrors.confirmPassword && <Error error={fieldErrors.confirmPassword} />}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-semibold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </StepTransition>
    </div>
  );
}
