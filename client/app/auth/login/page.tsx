import { LoginForm } from "@/components/auth/login-form";
import { DotPattern } from "@/components/layouts/dot-pattern";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login Page",
  description: "Welcome login page",
};

export default function LoginPage() {
  return (
    <DotPattern className="min-h-screen bg-[radial-gradient(circle_at_top,_#065f46_0%,_#022c22_40%,_#020617_100%)]">
      <LoginForm />
    </DotPattern>
  );
}
