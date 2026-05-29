import { z } from "zod";

export const CreateCustomerSchema = z.object({
  fullName: z.string().min(3),
  cpf: z.string().min(11).max(14),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
});

export const CustomerIdParamsSchema = z.object({
  id: z.string().min(1),
});

