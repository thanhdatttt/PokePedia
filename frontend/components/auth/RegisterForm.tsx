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
import { emailStepSchema, fieldErrorsFrom, registerDetailsSchema } from "@/lib/validations/auth.schema";
import { showApiError } from "@/lib/toast";

const STEPS = ["Email", "Verify", "Details"];

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const register = useAuthStore((state) => state.register);
  const sendOTP = useAuthStore((state) => state.sendOTP);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Step 0: email
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
      await sendOTP(result.data.email, "REGISTER");
      setStep(1);
    } catch (err) {
      showApiError(err, "Failed to send OTP. Please try again.");
    } finally {
      setStepLoading(false);
    }
  }

  // Step 2: details
  async function handleDetailsSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const input = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = registerDetailsSchema.safeParse(input);
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }

    try {
      await register(result.data.username, email, result.data.password);
      router.push("/login");
    } catch (err) {
      showApiError(err, "Failed to create your account. Please try again.");
    }
  }

  return (
    <div>
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
              {fieldErrors.email && <Error error={fieldErrors.email} />}
            </div>

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
          <form onSubmit={handleDetailsSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>

              <Input
                id="username"
                name="username"
                placeholder="Ash Ketchum"
                className="h-12 rounded-xl text-base"
              />
              {fieldErrors.username && <Error error={fieldErrors.username} />}
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
                  className="h-12 rounded-xl pr-12 text-base"
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
              {fieldErrors.password && <Error error={fieldErrors.password} />}
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
              />
              {fieldErrors.confirmPassword && <Error error={fieldErrors.confirmPassword} />}
            </div>

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
