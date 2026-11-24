import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function InvitationUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight">
          Invitation unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This invitation link is invalid, expired, or no longer available.
          Please contact the buyer who sent you the invitation if you need
          assistance.
        </p>

        <div className="mt-7">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to homepage
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">Powered by Arbiter</p>
      </div>
    </main>
  );
}
