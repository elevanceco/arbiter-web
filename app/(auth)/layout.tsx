export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-xl border border-border shadow-sm">
        {children}
      </div>
    </div>
  );
}
