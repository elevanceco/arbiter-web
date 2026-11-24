"use client";

import { motion, type Variants } from "framer-motion";

interface ProductMockupProps {
  variants?: Variants;
}

export function ProductMockup({ variants }: ProductMockupProps) {
  return (
    // `dark` keeps the mockup on the dark theme tokens regardless of app theme.
    <motion.div
      variants={variants}
      className="dark w-full max-w-4xl perspective-[2000px]"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative select-none overflow-hidden rounded-2xl border border-border bg-card p-4 font-mono text-sm shadow-2xl shadow-background/40 sm:p-6"
      >
        {/* Glossy top reflection */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />

        {/* Header */}
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-border pb-4">
          {/* macOS window controls: close, minimize, fullscreen */}
          <div className="absolute -left-2 -top-2 mb-4 flex gap-2 sm:left-0 sm:top-0">
            <div className="h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full border border-[#dea123] bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full border border-[#1aab29] bg-[#28c840]" />
          </div>

          <div className="ml-0 mt-4 sm:ml-16 sm:mt-0">
            <div className="font-sans text-base font-semibold text-foreground">
              Packaging Materials Q4
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              RFQ-2026-0042 · 3 invited suppliers
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-chart-3 sm:mt-0">
            <span className="h-2 w-2 rounded-full bg-primary" />
            QUOTATIONS RECEIVED
          </div>
        </div>

        {/* Summary Cards */}
        <div className="relative z-10 mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Quotations Received
            </div>
            <div className="text-2xl font-bold text-foreground">3 of 3</div>
            <div className="mt-1 text-xs text-primary">
              All suppliers responded
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Items Quoted
            </div>
            <div className="text-2xl font-bold text-chart-3">4 of 4</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Across all quotations
            </div>
          </div>
        </div>

        {/* Quotation Comparison */}
        <div className="relative z-10 overflow-hidden rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="font-sans text-sm font-semibold text-foreground">
              Quotation Comparison
            </div>
            <div className="text-xs text-primary">3 quotations</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left">
              <thead className="border-b border-border bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Supplier</th>
                  <th className="p-4 font-medium">Unit Price</th>
                  <th className="p-4 font-medium">Delivery</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                <tr className="bg-primary/[0.07]">
                  <td className="p-4 font-medium text-foreground">
                    Supplier A
                  </td>
                  <td className="p-4 font-semibold text-foreground">$48.50</td>
                  <td className="p-4 text-foreground/75">14 days</td>
                  <td className="p-4">
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-chart-3">
                      Submitted
                    </span>
                  </td>
                </tr>

                <tr className="transition-colors hover:bg-muted/60">
                  <td className="p-4 text-foreground/90">Supplier B</td>
                  <td className="p-4 text-foreground/75">$49.20</td>
                  <td className="p-4 text-foreground/75">10 days</td>
                  <td className="p-4">
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-chart-3">
                      Submitted
                    </span>
                  </td>
                </tr>

                <tr className="transition-colors hover:bg-muted/60">
                  <td className="p-4 text-foreground/90">Supplier C</td>
                  <td className="p-4 text-foreground/75">$50.10</td>
                  <td className="p-4 text-foreground/75">7 days</td>
                  <td className="p-4">
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-chart-3">
                      Submitted
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-xs text-muted-foreground">
            Quotations are private and visible only to the buyer.
          </div>

          <div className="rounded-lg bg-primary px-4 py-2 font-sans text-xs font-semibold text-primary-foreground">
            Review Quotations
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
