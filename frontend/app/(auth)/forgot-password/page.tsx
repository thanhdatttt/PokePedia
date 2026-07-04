import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" description="We'll guide you through it in a few steps.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}