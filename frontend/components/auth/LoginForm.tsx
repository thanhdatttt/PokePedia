"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepTransition } from "./StepTransition";
import { Error } from "../util/Error";
import { fieldErrorsFrom, loginSchema } from "@/lib/validations/auth.schema";
import { showApiError } from "@/lib/toast";

export function LoginForm() {
  const router = useRouter();

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const input = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(input);
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }

    try {
      await login(result.data.email, result.data.password);
      router.push("/");
    } catch (err) {
      
    }
  }

  return (
    <StepTransition stepKey={0}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">
            Email
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ash@pokepedia.com"
            className="h-12 rounded-xl text-base"
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
          {(fieldErrors.password || fieldErrors.email) && (
            <Error error={fieldErrors.password || fieldErrors.email} />
          )}
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-base text-muted-foreground transition-colors hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {isLoading ? "Signing in..." : "Login"}
        </Button>

        <p className="text-center text-base text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary transition-colors hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </StepTransition>
  );
}