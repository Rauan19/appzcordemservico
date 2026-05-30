import { z } from "zod";

export const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(20),
  platform: z.enum(["android", "ios", "web"]),
});

export const UnregisterDeviceTokenSchema = z.object({
  token: z.string().min(20),
});

export const SendManualPushSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  technicianIds: z.array(z.string()).optional(),
  orderId: z.string().optional(),
});
