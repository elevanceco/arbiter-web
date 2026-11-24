import { EventDetails } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventScopeCardProps {
  event: EventDetails;
}

export default function EventScopeCard({ event }: EventScopeCardProps) {
  const itemCount = event.lots.reduce(
    (total, lot) => total + lot.items.length,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event scope</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-5 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Lots</p>
          <p className="mt-1 text-xl font-semibold">{event.lots.length}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Items</p>
          <p className="mt-1 text-xl font-semibold">{itemCount}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Suppliers</p>
          <p className="mt-1 text-xl font-semibold">
            {event.eventSuppliers.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
