import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a symbol");

const email = z
  .email("Enter a valid email address");

// login schema
export const loginSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// send otp schema
export const emailStepSchema = z.object({
  email,
});

// register schema
export const registerDetailsSchema = z
  .object({
    username: z.string().min(5, "Username must be at least 5 characters"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// reset password schema
export const resetPasswordSchema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// otp schema
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Code must contain numbers only"),
});

// error messages
export function fieldErrorsFrom(result: { success: false; error: z.ZodError }) {
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
