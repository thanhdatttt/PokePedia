import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back trainer">
      <LoginForm />
    </AuthCard>
  );
}