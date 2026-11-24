"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LogoTextOnly from "../ui/LogoTextOnly";
import GoogleSignInButton from "./GoogleSignInButton";
import Logo from "../ui/Logo";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid credentials. Please try again.");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Logo />

        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to your <LogoTextOnly /> workspace.
        </p>
      </div>

      <GoogleSignInButton callbackURL="/dashboard" text="Sign in with Google" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          {/* Using bg-card to seamlessly blend with the AuthLayout's card background */}
          <span className="bg-card px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div>
          <Input
            type="email"
            placeholder="Email"
            {...form.register("email")}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-xs mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Input
            type="password"
            placeholder="Password"
            {...form.register("password")}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.password && (
            <p className="text-destructive text-xs mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground mt-6">
        <Link
          href="/forgot-password"
          className="hover:text-primary transition-colors font-medium"
        >
          Forgot password?
        </Link>
        <div className="mt-2">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
