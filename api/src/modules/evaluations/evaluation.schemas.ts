import { z } from "zod";

export const CreateEvaluationSchema = z.object({
  serviceOrderId: z.string().min(1),
  technicianId: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const ListEvaluationsQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  technicianId: z.string().min(1).optional(),
});
