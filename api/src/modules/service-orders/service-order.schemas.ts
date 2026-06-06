import { z } from "zod";

export const CreateServiceOrderSchema = z.object({
  customerId: z.string().min(1),
  addressId: z.string().min(1).optional(),
  assignedToId: z.string().min(1).optional(),
  assignedToIds: z.array(z.string().min(1)).optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  scheduledAt: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ])
    .optional(),
  customerPppoeUser: z.string().min(1).optional(),
  customerPppoePassword: z.string().min(1).optional(),
});

export const ServiceOrderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const UpdateServiceOrderStatusSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELED"]),
});

export const UpdateTechnicianReportSchema = z.object({
  technicianReport: z.string().max(5000).optional().nullable(),
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
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  technicianId: z.string().min(1).optional(),
  assignedTo: z.enum(["me"]).optional(),
  scheduled: z.enum(["today", "scheduled", "unscheduled", "overdue"]).optional(),
  createdPeriod: z.enum(["day", "month", "year"]).optional(),
  q: z.string().min(1).optional(),
  scheduledFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduledTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  withPppoe: z.literal("true").optional(),
});

