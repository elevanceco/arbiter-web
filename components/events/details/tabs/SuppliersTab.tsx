import { Building2, Mail, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDetails } from "../types";

interface SuppliersTabProps {
  event: EventDetails;
}

const supplierStatusStyles: Record<string, string> = {
  SELECTED: "bg-slate-100 text-slate-700 border-slate-200",
  INVITED: "bg-blue-50 text-blue-700 border-blue-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-amber-50 text-amber-700 border-amber-200",
  REVOKED: "bg-red-50 text-red-700 border-red-200",
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function SuppliersTab({ event }: SuppliersTabProps) {
  const suppliers = event.eventSuppliers;

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="mb-4 h-10 w-10 text-muted-foreground/50" />

          <h3 className="font-semibold">No suppliers selected</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Suppliers added to this event will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const acceptedCount = suppliers.filter(
    (supplier) => supplier.status === "ACCEPTED",
  ).length;

  const invitedCount = suppliers.filter(
    (supplier) => supplier.status === "INVITED",
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total suppliers</p>
            <p className="mt-2 text-2xl font-semibold">{suppliers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Invitations sent</p>
            <p className="mt-2 text-2xl font-semibold">{invitedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Accepted invitations
            </p>
            <p className="mt-2 text-2xl font-semibold">{acceptedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invited suppliers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Supplier participation and invitation status.
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {suppliers.map((eventSupplier) => {
              const invitation = eventSupplier.invitation;
              const supplier = eventSupplier.supplier;

              const email = invitation?.email || supplier?.email;

              return (
                <div
                  key={eventSupplier.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {supplier?.name}
                      </p>

                      {supplier?.contactName && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserRound className="h-3 w-3" />
                          {supplier.contactName}
                        </p>
                      )}

                      {email && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {email}
                        </p>
                      )}

                      {!supplier && invitation && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          External supplier
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge
                      variant="outline"
                      className={
                        supplierStatusStyles[eventSupplier.status] || ""
                      }
                    >
                      {formatStatus(eventSupplier.status)}
                    </Badge>

                    {invitation?.firstAccessedAt && (
                      <span className="text-xs text-muted-foreground">
                        Link accessed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
