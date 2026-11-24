import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Arbiter",
  description: "Sign in to your Arbiter workspace.",
};

export default function LoginPage() {
  return <LoginForm />;
}
