import { SourcingEventStatus } from "@/lib/generated/prisma/enums";

export type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  referenceCode: string | null;
  status: SourcingEventStatus;
  currency: string;
  timezone: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  lots: {
    id: string;
    name: string;
    description: string | null;
    order: number;
    items: {
      id: string;
      name: string;
      description: string | null;
      quantity: string;
      unit: string;
      specification: string | null;
      referencePrice: string | null;
      order: number;
    }[];
  }[];

  eventSuppliers: {
    id: string;
    supplierId: string;
    status: "SELECTED" | "INVITED" | "ACCEPTED" | "DECLINED" | "REVOKED";
    createdAt: Date;
    supplier: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      contactName: string | null;
    } | null;
    invitation: {
      id: string;
      companyName: string;
      contactName: string | null;
      email: string;
      status: string;
      expiresAt: Date;
      revokedAt: Date | null;
      firstAccessedAt: Date | null;
      lastAccessedAt: Date | null;
    } | null;
  }[];
};
