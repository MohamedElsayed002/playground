import { LoginForm } from "@/components/auth-fastapi/login-form";
import { DotPattern } from "@/components/layouts/dot-pattern";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login Page | FastAPI",
  description: "Welcome login page",
};

export default function LoginPage() {
  return (
    <DotPattern className="min-h-screen bg-[radial-gradient(circle_at_top,_#dc2626_0%,_#450a0a_40%,_#020617_100%)]">
      <LoginForm/>
    </DotPattern>
  );
}
