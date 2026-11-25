"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

interface EditableScheduleDateProps {
  label: string;
  value: Date | null;
  timezone: string;
  actionLabel: string;
  onSave: (date: Date) => Promise<{ success: boolean; error?: string }>;
  validateDate?: (date: Date) => string | null;
  onSaved?: () => void;
}

export function EditableScheduleDate({
  label,
  value,
  timezone,
  actionLabel,
  onSave,
  validateDate,
  onSaved,
}: EditableScheduleDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ?? undefined,
  );
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setSelectedDate(value ?? undefined);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!selectedDate) {
      toast.error("Please select a date.");
      return;
    }

    const validationError = validateDate?.(selectedDate);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const result = await onSave(selectedDate);

      if (!result.success) {
        toast.error(result.error ?? "Unable to update the date.");
        return;
      }

      toast.success(`${label} updated successfully.`);
      setIsEditing(false);
      onSaved?.();
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">{label}</p>

        <Popover>
          <PopoverTrigger>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!selectedDate || isPending}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {value
          ? new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: timezone,
            }).format(value)
          : "Not specified"}
      </p>

      <Button
        variant="link"
        size="sm"
        className="mt-1 h-auto p-0"
        onClick={() => {
          setSelectedDate(value ?? undefined);
          setIsEditing(true);
        }}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
