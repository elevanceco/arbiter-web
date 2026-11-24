import { z } from "zod";

const decimalString = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,14}(\.\d{1,4})?$/, `${label}: up to 14 digits and 4 decimals`)
    .refine((v) => Number(v) > 0, `${label} must be greater than 0`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));

export const quotationLineSchema = z.object({
  itemId: z.string().min(1),
  quotedQuantity: decimalString("Quantity"),
  unitPrice: decimalString("Unit price"),
  leadTimeDays: z.number().int().min(0).max(3650).nullable(),
  notes: optionalText(1000),
});

export const quotationInputSchema = z.object({
  currency: z.string().length(3),
  leadTimeDays: z.number().int().min(0).max(3650).nullable(),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  deliveryTerms: optionalText(2000),
  paymentTerms: optionalText(2000),
  notes: optionalText(4000),
  lines: z
    .array(quotationLineSchema)
    .min(1)
    .max(500)
    .refine(
      (lines) => new Set(lines.map((l) => l.itemId)).size === lines.length,
      "Duplicate items in quotation",
    ),
});

export type QuotationInput = z.infer<typeof quotationInputSchema>;
