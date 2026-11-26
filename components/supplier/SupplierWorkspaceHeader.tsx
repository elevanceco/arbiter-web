import { ShieldCheck } from "lucide-react";

export default function SupplierWorkspaceHeader() {
  return (
    <header className="border-b bg-background/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Arbiter</h1>
          <p className="text-xs text-muted-foreground">Supplier workspace</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Secure RFQ access
        </div>
      </div>
    </header>
  );
}
