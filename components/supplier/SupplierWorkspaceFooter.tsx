import { FileText } from "lucide-react";

export default function SupplierWorkspaceFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
      <FileText className="h-3.5 w-3.5" />
      <span>Powered by Arbiter</span>
    </footer>
  );
}
