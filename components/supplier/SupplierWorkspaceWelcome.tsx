type SupplierWelcomeProps = {
  contactName?: string | null;
  companyName?: string | null;
};

export default function SupplierWelcome({
  contactName,
  companyName,
}: SupplierWelcomeProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="bg-primary px-6 py-6 text-primary-foreground sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          Supplier workspace
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome{contactName ? `, ${contactName}` : ""}!
        </h2>

        {companyName && (
          <p className="mt-1 text-sm opacity-80">{companyName}</p>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <p className="font-medium">
          You've been invited to participate in a sourcing request.
        </p>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Review the requested items and specifications below, then prepare your
          quotation. We&apos;ve made the process straightforward so you can
          focus on your offer.
        </p>
      </div>
    </section>
  );
}
