"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "./StepIndicator";
import { StepTransition } from "./StepTransition";
import { OtpStep } from "./OTPStep";
import { Error } from "../util/Error";

const STEPS = ["Email", "Verify", "Details"];

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const register = useAuthStore((state) => state.register);
  const sendOTP = useAuthStore((state) => state.sendOTP);
  const isLoading = useAuthStore((state) => state.isLoading);
  const registerError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const error = registerError || stepError;

  // Step 0: email
  async function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStepError(null);
    setStepLoading(true);
    try {
      await sendOTP(email, "REGISTER");
      setStep(1);
    } catch (err: any) {
      setStepError(err.message ? err.message : "Can not find an account with that email.");
    } finally {
      setStepLoading(false);
    }
  }

  // Step 2: details
  async function handleDetailsSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();
    setStepError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setStepError("Passwords don't match.");
      return;
    }

    try {
      await register(username, email, password);
      router.push("/login");
    } catch (err: any) {
      setStepError(err.message ? err.message : "Can not create your account. Please try again.");
      throw err;
    }
  }

  return (
    <div>
      <StepIndicator steps={STEPS} current={step} />

      <StepTransition stepKey={step}>
        {step === 0 && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                required
              />
            </div>

            {stepError && (
              <Error error={stepError} />
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-semibold"
              size="lg"
              disabled={stepLoading}
            >
              {stepLoading ? "Sending code..." : "Continue"}
            </Button>

            <p className="text-center text-base text-muted-foreground">
              Already have an account?{" "}
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
            type="REGISTER"
            onVerified={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>

              <Input
                id="username"
                name="username"
                placeholder="Ash Ketchum"
                className="h-12 rounded-xl text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={8}
                  className="h-12 rounded-xl pr-12 text-base"
                  required
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">
                Confirm password
              </Label>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 rounded-xl text-base"
                required
              />
            </div>

            {(error) && (
              <Error error={error} />
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-semibold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}
      </StepTransition>
    </div>
  );
}
