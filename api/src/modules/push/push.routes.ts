import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { PushController } from "./push.controller.ts";

export async function pushRoutes(app: FastifyInstance) {
  const controller = new PushController();
  const technicianOnly = { onRequest: [requireRoles("TECHNICIAN")] };

  app.post("/device-token", technicianOnly, controller.register);
  app.delete("/device-token", technicianOnly, controller.unregister);
}
