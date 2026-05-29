import { z } from "zod";

export const CreateCustomerRatingSchema = z.object({
  serviceOrderId: z.string().min(1),
  rating: z.coerce.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
});
