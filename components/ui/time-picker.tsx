"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseLocalDateTime(value?: string): Date | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);

  if (!match) return undefined;

  const [, year, month, day, hours, minutes] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  );
}

function formatLocalDateTime(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function TimePicker({
  value,
  onChange,
  label,
  id = "datetime-picker",
  disabled = false,
  className,
  minDate,
  maxDate,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = parseLocalDateTime(value);

  const timeValue = date ? format(date, "HH:mm") : "";

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const minTime =
    date && minDate && isSameDay(date, minDate)
      ? format(minDate, "HH:mm")
      : undefined;

  const today = getToday();

  const effectiveMinDate = minDate && minDate > today ? minDate : today;
  const effectiveMaxDate = maxDate;

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    if (
      minDate &&
      selectedDate <
        new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    ) {
      return;
    }

    const newDate = new Date(selectedDate);

    if (date) {
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    } else {
      newDate.setHours(0, 0, 0, 0);
    }

    // If selecting the same day as the minimum,
    // don't allow an earlier time.
    if (minDate && isSameDay(newDate, minDate) && newDate < minDate) {
      newDate.setHours(minDate.getHours(), minDate.getMinutes(), 0, 0);
    }

    onChange(formatLocalDateTime(newDate));
    setOpen(false);
  };

  const handleTimeChange = (time: string) => {
    if (!date || !time) return;

    const [hours, minutes] = time.split(":").map(Number);

    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);

    if (minDate && newDate < minDate) return;

    onChange(formatLocalDateTime(newDate));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Date picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                type="button"
                id={`${id}-date`}
                disabled={disabled}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {date ? format(date, "PPP") : "Select date"}
                </span>
                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            }
          />

          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date ?? effectiveMinDate}
              disabled={(day) => {
                const dayStart = new Date(
                  day.getFullYear(),
                  day.getMonth(),
                  day.getDate(),
                );

                const minDay = new Date(
                  effectiveMinDate.getFullYear(),
                  effectiveMinDate.getMonth(),
                  effectiveMinDate.getDate(),
                );

                if (dayStart < minDay) return true;

                if (effectiveMaxDate) {
                  const maxDay = new Date(
                    effectiveMaxDate.getFullYear(),
                    effectiveMaxDate.getMonth(),
                    effectiveMaxDate.getDate(),
                  );

                  if (dayStart > maxDay) return true;
                }

                return false;
              }}
              onSelect={handleDateChange}
            />
          </PopoverContent>
        </Popover>

        {/* Time picker */}
        <Input
          type="time"
          id={`${id}-time`}
          step="60"
          min={minTime}
          value={timeValue}
          disabled={disabled || !date}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
