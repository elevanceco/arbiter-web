import type { SourcingEventStatus } from "@/lib/generated/prisma/enums";

export function getEventActions(
  status: SourcingEventStatus,
  acceptedSupplierCount: number,
) {
  return {
    canEdit: status === "DRAFT",
    showOpenRound: status === "INVITATION_PENDING",
    canOpenRound: status === "INVITATION_PENDING" && acceptedSupplierCount > 0,
    showCloseRound: status === "OPEN",
    showRenegotiate: status === "CLOSED",
    showAward: status === "CLOSED",
    showCancel: status === "INVITATION_PENDING",
  };
}
