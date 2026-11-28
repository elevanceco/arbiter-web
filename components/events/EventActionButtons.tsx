"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Play, Square, RefreshCw, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  closeRoundAction,
  openRoundAction,
} from "@/features/events/actions/event-actions";
import { EventDetails } from "./details/types";
import { toast } from "sonner";
import { getEventActions } from "@/features/events/event-rules";

export function EventActionButtons({ event }: { event: EventDetails }) {
  const [pending, startTransition] = useTransition();

  const acceptedSupplierCount = event.eventSuppliers.filter(
    (s) => s.status === "ACCEPTED",
  ).length;

  const a = getEventActions(event.status, acceptedSupplierCount);

  function run(
    action: (
      id: string,
    ) => Promise<{ success: boolean; error?: string } | undefined>,
  ) {
    startTransition(async () => {
      const result = await action(event.id);
      if (result && !result.success) {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {a.canEdit && (
        <Button variant="outline">
          <Link href={`/events/${event.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit event
          </Link>
        </Button>
      )}

      {a.showOpenRound && (
        <Button
          disabled={!a.canOpenRound || pending}
          title={
            !a.canOpenRound
              ? "At least one supplier must accept the invitation"
              : undefined
          }
          onClick={() => run(openRoundAction)}
        >
          <Play className="mr-2 h-4 w-4" /> Open round
        </Button>
      )}

      {a.showCloseRound && (
        <ConfirmAction
          trigger={
            <>
              <Square className="mr-2 h-4 w-4" /> Close round
            </>
          }
          title="Close this round?"
          description="Suppliers will no longer be able to submit prices. They can still open their link and will see that prices are under review."
          confirmLabel="Close round"
          disabled={pending}
          onConfirm={() => startTransition(() => closeRoundAction(event.id))}
        />
      )}

      {a.showRenegotiate && (
        <Button variant="outline">
          <Link href={`/events/${event.id}/renegotiate`}>
            <RefreshCw className="mr-2 h-4 w-4" /> Renegotiate
          </Link>
        </Button>
      )}

      {a.showAward && (
        <Button>
          <Link href={`/events/${event.id}/award`}>
            <Trophy className="mr-2 h-4 w-4" /> Award supplier
          </Link>
        </Button>
      )}

      {/* {a.showCancel && (
        <ConfirmAction
          variant="destructive"
          trigger={
            <>
              <XCircle className="mr-2 h-4 w-4" /> Cancel RFQ
            </>
          }
          title="Cancel this RFQ?"
          description="This can't be undone once suppliers have been invited."
          confirmLabel="Cancel RFQ"
          disabled={pending}
          onConfirm={() => startTransition(() => cancelEventAction(event.id))}
        />
      )} */}
    </div>
  );
}

function ConfirmAction(props: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "destructive" | "outline";
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button variant={props.variant ?? "outline"} disabled={props.disabled}>
          {props.trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction onClick={props.onConfirm}>
            {props.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
