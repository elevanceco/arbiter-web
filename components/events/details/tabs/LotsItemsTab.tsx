import { Layers3, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDetails } from "../types";

interface LotsItemsTabProps {
  event: EventDetails;
}

export function LotsItemsTab({ event }: LotsItemsTabProps) {
  const itemCount = event.lots.reduce(
    (total, lot) => total + lot.items.length,
    0,
  );

  if (event.lots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Layers3 className="mb-4 h-10 w-10 text-muted-foreground/50" />

          <h3 className="font-semibold">No lots added yet</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This event doesn't contain any lots or items yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Lots and items</h3>
          <p className="text-sm text-muted-foreground">
            Review the products and requirements included in this event.
          </p>
        </div>

        <Badge variant="secondary">
          {event.lots.length} lots · {itemCount} items
        </Badge>
      </div>

      {event.lots.map((lot, index) => (
        <Card key={lot.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Layers3 className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    {lot.name || `Lot ${index + 1}`}
                  </CardTitle>

                  {lot.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lot.description}
                    </p>
                  )}
                </div>
              </div>

              <Badge variant="outline">
                {lot.items.length} {lot.items.length === 1 ? "item" : "items"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {lot.items.length === 0 ? (
              <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No items in this lot.
              </p>
            ) : (
              <div className="space-y-3">
                {lot.items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {item.name || `Item ${itemIndex + 1}`}
                          </p>

                          {item.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-medium">
                          {item.quantity} {item.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Required quantity
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 border-t pt-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Specification
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {item.specification || "No specification provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Reference price
                        </p>
                        <p className="mt-1 text-sm">
                          {item.referencePrice
                            ? `${event.currency} ${item.referencePrice}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
