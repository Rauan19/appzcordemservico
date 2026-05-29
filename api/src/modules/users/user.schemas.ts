import { z } from "zod";

export const UserIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const UpdateUserActiveSchema = z.object({
  active: z.boolean(),
});
