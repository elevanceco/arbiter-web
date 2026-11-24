import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { EventDetails } from "../../types";

interface EventDescriptionCardProps {
  event: EventDetails;
}

export default function EventDescriptionCard({
  event,
}: EventDescriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Event description
        </CardTitle>
      </CardHeader>

      <CardContent>
        {event.description ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {event.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description has been added to this event.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
