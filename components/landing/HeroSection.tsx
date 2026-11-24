"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { ProductMockup } from "../ui/ProductMockup";

const AnimatedBackground = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  const paths = [
    "M-10% 20% C 30% 10%, 60% 40%, 110% 20%",
    "M-10% 60% C 20% 80%, 70% 30%, 110% 50%",
    "M110% 70% C 80% 90%, 30% 50%, -10% 80%",
    "M20% -10% C 40% 30%, 30% 70%, 10% 110%",
    "M80% -10% C 60% 40%, 90% 80%, 70% 110%",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
      <svg className="absolute h-full w-full">
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop
              offset="50%"
              style={{ stopColor: "var(--primary)", stopOpacity: 0.8 }}
            />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <linearGradient
            id="glowGradientAlt"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="transparent" />
            <stop
              offset="50%"
              style={{ stopColor: "var(--chart-2)", stopOpacity: 0.6 }}
            />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {paths.map((path, i) => (
          <motion.path
            key={i}
            d={path}
            fill="transparent"
            stroke={
              i % 2 === 0 ? "url(#glowGradient)" : "url(#glowGradientAlt)"
            }
            strokeWidth={i % 2 === 0 ? "2" : "1"}
            initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
            animate={{
              pathLength: [0, 0.5, 0.5, 0],
              opacity: [0, 1, 1, 0],
              pathOffset: [0, 0, 0.5, 1],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.2,
            }}
          />
        ))}
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/80 to-background" />
    </div>
  );
};

export default function HeroSection() {
  const { data, isPending } = authClient.useSession();
  const isLoggedIn = !!data?.user;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const primaryButtonClasses =
    "w-full rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground " +
    "shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_20%,transparent)] transition-all " +
    "hover:bg-primary/90 hover:shadow-[0_0_30px_color-mix(in_oklab,var(--primary)_35%,transparent)] sm:w-auto";

  return (
    // `dark` scopes the dark theme variables to the hero, so it stays dark
    // even when the rest of the app is in light mode.
    <section className="dark relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <AnimatedBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center"
      >
        <div className="mb-16 max-w-4xl text-center">
          <motion.h1
            variants={itemVariants}
            className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Run supplier RFQs without the{" "}
            <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
              spreadsheet chaos.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-foreground/75 md:text-xl"
          >
            Invite suppliers, collect structured quotations, compare offers
            side-by-side, and award vendors—all in one auditable sourcing
            workflow.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {isPending ? (
              <div className="h-14 w-full animate-pulse rounded-lg bg-muted sm:w-[180px]" />
            ) : isLoggedIn ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className={primaryButtonClasses}>
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto">
                <button className={primaryButtonClasses}>
                  Start Free Trial
                </button>
              </Link>
            )}

            <Link href="#how-it-works" className="w-full sm:w-auto">
              <button className="w-full rounded-lg border border-primary/30 bg-card/60 px-8 py-4 font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-muted sm:w-auto">
                See How It Works
              </button>
            </Link>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-sm text-muted-foreground"
          >
            No credit card required.
          </motion.p>
        </div>

        <ProductMockup variants={itemVariants} />
      </motion.div>
    </section>
  );
}
