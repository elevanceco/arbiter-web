"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Save, AlertTriangle } from "lucide-react";
import type { SourcingLotData } from "./Step2LotsItems";

type EventData = {
  title: string;
  referenceCode: string;
  description: string;
  currency: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
};

interface Step4ReviewProps {
  mode: "create" | "edit";
  eventData: EventData;
  lots: SourcingLotData[];
  selectedSuppliers: string[];
  isSubmitting: boolean;
  onBack: () => void;
  onSaveDraft: () => void | Promise<void>;
  onSaveAndSendInvitations?: () => Promise<boolean>;
}

function formatDate(value: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString();
}

export function Step4Review({
  mode,
  eventData,
  lots,
  selectedSuppliers,
  isSubmitting,
  onBack,
  onSaveDraft,
  onSaveAndSendInvitations,
}: Step4ReviewProps) {
  const [confirmSend, setConfirmSend] = useState(false);

  const totalItems = lots.reduce((total, lot) => total + lot.items.length, 0);

  const handleSendConfirmation = async () => {
    if (!onSaveAndSendInvitations) return;

    await onSaveAndSendInvitations();
    setConfirmSend(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Review Sourcing Event
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Review the details below before saving your event.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Event Summary</h3>
        </div>

        <div className="space-y-6 p-6">
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Event Title</p>
              <p className="mt-1 text-base text-slate-900">
                {eventData.title || "Untitled event"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Reference Code
              </p>
              <p className="mt-1 text-base text-slate-900">
                {eventData.referenceCode || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Starts</p>
              <p className="mt-1 text-sm text-slate-900">
                {formatDate(eventData.startsAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Ends</p>
              <p className="mt-1 text-sm text-slate-900">
                {formatDate(eventData.endsAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Currency</p>
              <p className="mt-1 text-sm text-slate-900">
                {eventData.currency}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Timezone</p>
              <p className="mt-1 text-sm text-slate-900">
                {eventData.timezone}
              </p>
            </div>
          </section>

          {eventData.description && (
            <>
              <hr className="border-slate-100" />
              <section>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">
                  Description
                </h4>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {eventData.description}
                </p>
              </section>
            </>
          )}

          <hr className="border-slate-100" />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                Lots & Items
              </h4>
              <span className="text-xs text-slate-500">
                {lots.length} lots · {totalItems} items
              </span>
            </div>

            <div className="space-y-3">
              {lots.map((lot) => (
                <div
                  key={lot.id}
                  className="overflow-hidden rounded-md border border-slate-200"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <p className="text-sm font-medium text-slate-800">
                      {lot.name}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {lot.items.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">
                        No items in this lot.
                      </p>
                    ) : (
                      lot.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2"
                        >
                          <div>
                            <p className="text-xs text-slate-500">Item</p>
                            <p className="text-sm font-medium text-slate-800">
                              {item.name}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">Quantity</p>
                            <p className="text-sm text-slate-800">
                              {item.quantity} {item.unit}
                            </p>
                          </div>

                          {item.specification && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-slate-500">
                                Specification
                              </p>
                              <p className="whitespace-pre-wrap text-sm text-slate-700">
                                {item.specification}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h4 className="text-sm font-semibold text-slate-900">
              Selected Suppliers
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {selectedSuppliers.length} supplier
              {selectedSuppliers.length !== 1 ? "s" : ""} selected from your
              supplier directory.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Selecting suppliers does not send invitations. Invitations are
              only sent when you explicitly choose that action.
            </p>
          </section>
        </div>
      </div>

      {confirmSend && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                Send invitations to selected suppliers?
              </h4>
              <p className="mt-1 text-sm text-amber-800">
                This will save your changes, launch the event, and send private
                invitation links to each eligible supplier with a valid email.
                Once invitations are sent, you will no longer be able to edit
                this event.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleSendConfirmation}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Confirm & Send"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setConfirmSend(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "edit" ? "Save Changes" : "Save Draft"}
          </Button>

          {mode === "edit" && onSaveAndSendInvitations && (
            <Button
              type="button"
              onClick={() => setConfirmSend(true)}
              disabled={
                isSubmitting || selectedSuppliers.length === 0 || confirmSend
              }
            >
              <Send className="mr-2 h-4 w-4" />
              Save Changes & Send Invitations
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
