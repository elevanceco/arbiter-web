"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseLocalDateTime, TimePicker } from "@/components/ui/time-picker";

const step1Schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  referenceCode: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().length(3, "Must be a 3-letter currency code"),
  timezone: z.string().min(1, "Timezone is required"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export type Step1FormData = z.infer<typeof step1Schema>;

interface Step1BasicsProps {
  initialData: Step1FormData;
  onNext: (data: Step1FormData) => void;
}

export function Step1Basics({ initialData, onNext }: Step1BasicsProps) {
  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData,
  });

  const submit = (data: Step1FormData) => {
    onNext(data);
  };

  const startsAt = form.watch("startsAt");
  const endsAt = form.watch("endsAt");

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Event Title *
          </label>
          <Input
            placeholder="e.g. Q4 Packaging Materials"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reference Code
            </label>
            <Input
              placeholder="e.g. PR-2026-089"
              {...form.register("referenceCode")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Event Type
            </label>

            <Input
              value="Standard RFQ"
              disabled
              className="cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <Textarea
            placeholder="General instructions or requirements for this event..."
            className="h-24"
            {...form.register("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Currency *
            </label>

            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Timezone *
            </label>

            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Asia/Jakarta">
                      Asia/Jakarta (GMT+7)
                    </SelectItem>
                    <SelectItem value="Asia/Singapore">
                      Asia/Singapore (GMT+8)
                    </SelectItem>
                    <SelectItem value="Australia/Sydney">
                      Australia/Sydney
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="startsAt"
            control={form.control}
            render={({ field }) => (
              <TimePicker
                id="startsAt"
                label="Starts At (Optional for Draft)"
                value={field.value ?? ""}
                onChange={field.onChange}
                maxDate={endsAt ? parseLocalDateTime(endsAt) : undefined}
              />
            )}
          />

          <Controller
            name="endsAt"
            control={form.control}
            render={({ field }) => (
              <TimePicker
                id="endsAt"
                label="Ends At (Optional for Draft)"
                value={field.value ?? ""}
                onChange={field.onChange}
                minDate={startsAt ? parseLocalDateTime(startsAt) : undefined}
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          type="submit"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Save & Continue
        </Button>
      </div>
    </form>
  );
}
