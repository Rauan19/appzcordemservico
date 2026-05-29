import { z } from "zod";

export const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(20),
  platform: z.enum(["android", "ios", "web"]),
});

export const UnregisterDeviceTokenSchema = z.object({
  token: z.string().min(20),
});
