import { Badge } from "@/components/ui/badge";
import { EventDetails } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventeDetailsCardProps {
  event: EventDetails;
}

export default function EventDetailsCard({ event }: EventeDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Reference code</p>
          <p className="mt-1 text-sm font-medium">
            {event.referenceCode || "Not assigned"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="mt-1 text-sm font-medium">{event.currency}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant="outline" className="mt-1">
            {event.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
