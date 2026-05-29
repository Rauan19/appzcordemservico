import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { UserController } from "./user.controller.ts";

export async function userRoutes(app: FastifyInstance) {
  const controller = new UserController();

  app.get("/technicians", controller.listTechnicians);

  app.get("/", { onRequest: [requireRoles("ADMIN", "MANAGER")] }, controller.list);

  app.patch(
    "/:id/active",
    { onRequest: [requireRoles("ADMIN")] },
    controller.setActive,
  );
}
