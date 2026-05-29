import { z } from "zod";

export const CreateStockMovementSchema = z.object({
  type: z.enum(["IN", "OUT_SERVICE_ORDER", "ADJUSTMENT", "RETURN", "DEFECT"]),
  productId: z.string().min(1),
  serviceOrderId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  quantity: z.coerce.number().positive(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const StockBalanceQuerySchema = z.object({
  productId: z.string().min(1).optional(),
});

export const ListStockMovementsQuerySchema = z.object({
  productId: z.string().min(1).optional(),
  serviceOrderId: z.string().min(1).optional(),
});

