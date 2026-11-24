"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { EventDetails } from "./types";

import { OverviewTab } from "./tabs/OverviewTab";
import { LotsItemsTab } from "./tabs/LotsItemsTab";
import { SuppliersTab } from "./tabs/SuppliersTab";
import { QuotationsTab } from "./tabs/QuotationsTab";
import { AwardTab } from "./tabs/AwardTab";

interface EventTabsProps {
  event: EventDetails;
}

export function EventTabs({ event }: EventTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="lots">Lots & Items</TabsTrigger>
        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        <TabsTrigger value="quotations">Quotations</TabsTrigger>
        <TabsTrigger value="award">Award</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab event={event} />
      </TabsContent>

      <TabsContent value="lots">
        <LotsItemsTab event={event} />
      </TabsContent>

      <TabsContent value="suppliers">
        <SuppliersTab event={event} />
      </TabsContent>

      <TabsContent value="quotations">
        <QuotationsTab event={event} />
      </TabsContent>

      <TabsContent value="award">
        <AwardTab event={event} />
      </TabsContent>
    </Tabs>
  );
}
