import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account">
      <RegisterForm />
    </AuthCard>
  );
}