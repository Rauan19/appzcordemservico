import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(4),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "STOCK", "TECHNICIAN"]),
});

export const UpdateMyLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
