import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/globals.css";
import { cn } from "cn";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Arbiter | B2B eSourcing & RFQ Platform",
  description:
    "Turn your Excel-based vendor quotation process into an auditable sourcing event in minutes. Create structured RFQs, compare supplier quotations, and export defensible audit trails.",
  keywords: [
    "eSourcing",
    "RFQ platform",
    "procurement software",
    "vendor quotation",
    "B2B sourcing",
    "Arbiter",
  ],
  authors: [{ name: "Arbiter" }],
  openGraph: {
    title: "Arbiter | Graduate from Excel-based Procurement",
    description:
      "Replace scattered supplier quotations across Excel and email with structured RFQs, centralized quotation comparison, and an auditable sourcing workflow.",
    url: "https://arbiter.com",
    siteName: "Arbiter",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbiter | B2B eSourcing Platform",
    description:
      "Turn your Excel-based vendor quotation process into an auditable sourcing event in minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans scroll-smooth", geist.variable)}>
      <body
        className={`${geist.variable} font-sans antialiased bg-black text-foreground flex flex-col min-h-screen`}
      >
        <main className="grow">
          {children}
          <Toaster position="top-right" richColors />
        </main>
      </body>
    </html>
  );
}
