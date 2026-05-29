import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  series: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  unit: z.string().min(1).default("un"),
  active: z.boolean().optional(),
});

export const ProductIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  series: z.string().min(1).nullable().optional(),
  sku: z.string().min(1).nullable().optional(),
  unit: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export const ProductIntakeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("restock"),
    productId: z.string().min(1),
    quantity: z.coerce.number().positive(),
    batchNote: z.string().max(500).optional(),
    reason: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("new"),
    name: z.string().min(2),
    series: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    unit: z.string().min(1).default("un"),
    quantity: z.coerce.number().positive().optional(),
    batchNote: z.string().max(500).optional(),
    reason: z.string().max(200).optional(),
  }),
]);

export const ProductSuggestQuerySchema = z.object({
  q: z.string().min(1),
});
