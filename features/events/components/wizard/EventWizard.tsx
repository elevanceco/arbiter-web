"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Step1Basics } from "./Step1Basics";
import { Step2LotsItems, type SourcingLotData } from "./Step2LotsItems";
import { Step3Suppliers } from "./Step3Suppliers";
import { Step4Review } from "./Step4Review";

export type EventWizardData = {
  title: string;
  referenceCode: string;
  description: string;
  currency: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
};

export type EventWizardInitialData = {
  eventData: EventWizardData;
  lots: SourcingLotData[];
  selectedSuppliers: string[];
};

type EventWizardPayload = EventWizardInitialData;

type SaveResult = {
  success: boolean;
  error?: string;
  eventId?: string;
};

type EventWizardProps =
  | {
      mode: "create";
      initialData?: EventWizardInitialData;
      onSave: (payload: EventWizardPayload) => Promise<SaveResult>;
    }
  | {
      mode: "edit";
      initialData: EventWizardInitialData;
      eventId: string;
      onSave: (
        payload: EventWizardPayload & { eventId: string },
      ) => Promise<SaveResult>;
      onSaveAndSendInvitations: (
        payload: EventWizardPayload & { eventId: string },
      ) => Promise<SaveResult>;
    };

const WIZARD_STEPS = [
  { id: 1, name: "Event Details" },
  { id: 2, name: "Lots & Items" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Review" },
];

const EMPTY_EVENT_DATA: EventWizardData = {
  title: "",
  referenceCode: "",
  description: "",
  currency: "USD",
  timezone: "Asia/Jakarta",
  startsAt: "",
  endsAt: "",
};

export function EventWizard(props: EventWizardProps) {
  const { mode, initialData, onSave } = props;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventData, setEventData] = useState<EventWizardData>(
    initialData?.eventData ?? EMPTY_EVENT_DATA,
  );

  const [lots, setLots] = useState<SourcingLotData[]>(initialData?.lots ?? []);

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(
    initialData?.selectedSuppliers ?? [],
  );

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        eventData,
        lots,
        selectedSuppliers,
      };

      let result;

      if (props.mode === "edit") {
        result = await props.onSave({
          ...payload,
          eventId: props.eventId,
        });
      } else {
        result = await props.onSave(payload);
      }

      if (!result.success) {
        toast.error(result.error ?? "Unable to save the event.");
        return;
      }

      toast.success(
        props.mode === "edit"
          ? "Event changes saved successfully."
          : "Draft saved successfully!",
      );

      const destinationId =
        props.mode === "edit" ? props.eventId : result.eventId;

      if (destinationId) {
        router.push(`/events/${destinationId}`);
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSendInvitations = async (): Promise<boolean> => {
    if (props.mode !== "edit") return false;

    setIsSubmitting(true);

    try {
      const result = await props.onSaveAndSendInvitations({
        eventId: props.eventId,
        eventData,
        lots,
        selectedSuppliers,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to send invitations.");
        return false;
      }

      toast.success("Event updated and invitations sent.");

      router.push(`/events/${result.eventId ?? props.eventId}`);
      router.refresh();

      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {WIZARD_STEPS.map((step, stepIdx) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isClickable = step.id <= currentStep;

              return (
                <li
                  key={step.name}
                  className={`relative ${
                    stepIdx !== WIZARD_STEPS.length - 1 ? "pr-8 sm:pr-20" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isClickable) setCurrentStep(step.id);
                    }}
                    disabled={!isClickable}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`group flex items-center rounded-lg transition-colors duration-200 ${
                      isClickable ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isCompleted
                          ? "border-primary bg-primary group-hover:border-primary/85 group-hover:bg-primary/85"
                          : isCurrent
                            ? "border-primary bg-white"
                            : "border-slate-300 bg-white"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <span
                          className={`text-xs font-semibold ${
                            isCurrent ? "text-primary" : "text-slate-500"
                          }`}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>

                    <span
                      className={`ml-3 hidden text-sm font-medium transition-colors duration-200 sm:block ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                            ? "text-slate-900 group-hover:text-primary"
                            : "text-slate-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="p-6 sm:p-8">
        {currentStep === 1 && (
          <Step1Basics
            initialData={eventData}
            onNext={(data) => {
              setEventData((prev) => ({ ...prev, ...data }));
              handleNext();
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2LotsItems
            initialLots={lots}
            onNext={(data) => {
              setLots(data);
              handleNext();
            }}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <Step3Suppliers
            mode={mode}
            selectedIds={selectedSuppliers}
            onNext={(ids) => {
              setSelectedSuppliers(ids);
              handleNext();
            }}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <Step4Review
            mode={props.mode}
            eventData={eventData}
            lots={lots}
            selectedSuppliers={selectedSuppliers}
            isSubmitting={isSubmitting}
            onBack={handleBack}
            onSaveDraft={handleSave}
            onSaveAndSendInvitations={
              props.mode === "edit" ? handleSaveAndSendInvitations : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
