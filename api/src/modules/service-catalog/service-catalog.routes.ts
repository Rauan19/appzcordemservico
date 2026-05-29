import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { ServiceCatalogController } from "./service-catalog.controller.ts";

export async function serviceCatalogRoutes(app: FastifyInstance) {
  const controller = new ServiceCatalogController();
  const managerOnly = { onRequest: [requireRoles("ADMIN", "MANAGER")] };

  app.get("/", controller.list);
  app.get("/:id", controller.getById);
  app.post("/", managerOnly, controller.create);
  app.patch("/:id", managerOnly, controller.update);
}
