"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LogoTextOnly from "../ui/LogoTextOnly";
import GoogleSignInButton from "./GoogleSignInButton";
import Logo from "../ui/Logo";

// Validation Schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Reusable Checklist Item
function ChecklistItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${
        met ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span>{label}</span>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      callbackURL: "/verify-email",
    });

    if (signUpError) {
      setError(
        signUpError.message ||
          "An error occurred during registration. Please try again.",
      );
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  // Watch field values for real-time checklist updates
  const watchName = form.watch("name") || "";
  const watchEmail = form.watch("email") || "";
  const watchPassword = form.watch("password") || "";

  // Validation Checkers
  const isNameValid = watchName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail);

  const passwordCriteria = [
    { label: "At least 8 characters", met: watchPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(watchPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(watchPassword) },
    { label: "One number", met: /[0-9]/.test(watchPassword) },
    {
      label: "One special character",
      met: /[^a-zA-Z0-9]/.test(watchPassword),
    },
  ];

  const metPasswordCriteriaCount = passwordCriteria.filter((c) => c.met).length;

  // Password Strength Indicator
  const strengthPercentage =
    (metPasswordCriteriaCount / passwordCriteria.length) * 100;

  let strengthColor = "bg-muted";

  if (metPasswordCriteriaCount > 0 && metPasswordCriteriaCount <= 2) {
    strengthColor = "bg-destructive";
  } else if (metPasswordCriteriaCount === 3 || metPasswordCriteriaCount === 4) {
    strengthColor = "bg-warning";
  } else if (metPasswordCriteriaCount === 5) {
    strengthColor = "bg-success";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Logo />

        <h1 className="text-2xl font-bold text-foreground">
          Create your <LogoTextOnly /> account
        </h1>
      </div>

      {/* Google Sign In */}
      <GoogleSignInButton callbackURL="/dashboard" text="Sign up with Google" />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        {/* Name Field */}
        <div>
          <Input
            placeholder="Full Name"
            {...form.register("name")}
            disabled={form.formState.isSubmitting}
            className="mb-2"
          />

          <ChecklistItem met={isNameValid} label="At least 2 characters" />
        </div>

        {/* Email Field */}
        <div>
          <Input
            type="email"
            placeholder="Email"
            {...form.register("email")}
            disabled={form.formState.isSubmitting}
            className="mb-2"
          />

          <ChecklistItem met={isEmailValid} label="Valid email format" />
        </div>

        {/* Password Field */}
        <div>
          <Input
            type="password"
            placeholder="Password"
            {...form.register("password")}
            disabled={form.formState.isSubmitting}
            className="mb-2"
          />

          {/* Password Strength Indicator */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-300 ${strengthColor}`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>

          {/* Password Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
            {passwordCriteria.map((criteria, idx) => (
              <ChecklistItem
                key={idx}
                met={criteria.met}
                label={criteria.label}
              />
            ))}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <Input
            type="password"
            placeholder="Confirm Password"
            {...form.register("confirmPassword")}
            disabled={form.formState.isSubmitting}
          />

          {form.formState.errors.confirmPassword && (
            <p className="text-destructive text-xs mt-1">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full mt-2"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          {form.formState.isSubmitting
            ? "Creating Account..."
            : "Create Account"}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
