import { z } from "zod";

export const CustomerIdParamsSchema = z.object({
  customerId: z.string().min(1),
});

export const AddressIdParamsSchema = z.object({
  customerId: z.string().min(1),
  id: z.string().min(1),
});

export const CreateAddressSchema = z.object({
  label: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  complement: z.string().optional(),
  reference: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});
