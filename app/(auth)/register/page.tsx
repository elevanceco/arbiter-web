import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Arbiter",
  description: "Create your Arbiter account to start running sourcing events.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
