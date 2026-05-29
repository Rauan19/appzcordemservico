import { z } from "zod";

export const CreateServiceCatalogSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const UpdateServiceCatalogSchema = CreateServiceCatalogSchema.partial();

export const ServiceCatalogIdParamsSchema = z.object({
  id: z.string().min(1),
});
