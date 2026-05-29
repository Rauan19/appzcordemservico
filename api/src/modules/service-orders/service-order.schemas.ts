import { z } from "zod";

export const CreateServiceOrderSchema = z.object({
  customerId: z.string().min(1),
  addressId: z.string().min(1).optional(),
  assignedToId: z.string().min(1).optional(),
  assignedToIds: z.array(z.string().min(1)).optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const ServiceOrderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const UpdateServiceOrderStatusSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELED"]),
});

export const AddServiceOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  description: z.string().optional(),
  reason: z.string().optional(),
});

export const AddServiceOrderItemsBatchSchema = z.object({
  items: z.array(AddServiceOrderItemSchema).min(1).max(100),
  reason: z.string().optional(),
});

export const RegisterDefectSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(3),
  note: z.string().optional(),
});

export const ListServiceOrdersQuerySchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  assignedTo: z.enum(["me"]).optional(),
});

