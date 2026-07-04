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

export function LoginForm() {
  const router = useRouter();

  // global states
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }

  return (
    <StepTransition stepKey={0}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>

        {error && (
          <Error error={error} />
        )}

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