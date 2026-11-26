"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { EventDetails } from "./types";

import { OverviewTab } from "./tabs/OverviewTab";
import { LotsItemsTab } from "./tabs/LotsItemsTab";
import { SuppliersTab } from "./tabs/SuppliersTab";
import { QuotationsTab } from "./tabs/QuotationsTab";
import { AwardTab } from "./tabs/AwardTab";
import { getEventQuotations } from "@/features/quotations/getEventQuotations";
import { getEventQuotationsAction } from "@/features/quotations/getEventQuotationsAction";

type QuotationsData = Awaited<ReturnType<typeof getEventQuotations>>;

interface EventTabsProps {
  event: EventDetails;
  onUpdateStartDate: (date: Date) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onUpdateEndDate: (date: Date) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function EventTabs({
  event,
  onUpdateStartDate,
  onUpdateEndDate,
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const [quotations, setQuotations] = useState<QuotationsData>([]);
  const [quotationsLoaded, setQuotationsLoaded] = useState(false);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);

  const handleTabChange = async (value: string) => {
    setActiveTab(value);

    if (value !== "quotations" || quotationsLoaded || quotationsLoading) {
      return;
    }

    setQuotationsLoading(true);
    setQuotationsError(null);

    try {
      const result = await getEventQuotationsAction(event.id);

      if (!result.success) {
        setQuotationsError(result.error);
        return;
      }

      setQuotations(result.data);
      setQuotationsLoaded(true);
    } catch {
      setQuotationsError("Failed to load quotations. Please try again.");
    } finally {
      setQuotationsLoading(false);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="lots">Lots & Items</TabsTrigger>
        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        <TabsTrigger value="quotations">Quotations</TabsTrigger>
        <TabsTrigger value="award">Award</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          event={event}
          onUpdateStartDate={onUpdateStartDate}
          onUpdateEndDate={onUpdateEndDate}
        />
      </TabsContent>

      <TabsContent value="lots">
        <LotsItemsTab event={event} />
      </TabsContent>

      <TabsContent value="suppliers">
        <SuppliersTab event={event} />
      </TabsContent>

      <TabsContent value="quotations">
        <QuotationsTab
          event={event}
          quotations={quotations}
          loading={quotationsLoading}
          error={quotationsError}
          onRetry={() => handleTabChange("quotations")}
        />
      </TabsContent>

      <TabsContent value="award">
        <AwardTab event={event} />
      </TabsContent>
    </Tabs>
  );
}
