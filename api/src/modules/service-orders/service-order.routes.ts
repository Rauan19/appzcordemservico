import type { FastifyInstance } from "fastify";
import { ServiceOrderController } from "./service-order.controller.ts";

export async function serviceOrderRoutes(app: FastifyInstance) {
  const controller = new ServiceOrderController();

  app.get("/", controller.list);
  app.get("/stats", controller.stats);
  app.get("/:id", controller.getById);
  app.post("/", controller.create);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.delete);
  app.patch("/:id/status", controller.updateStatus);
  app.patch("/:id/report", controller.updateTechnicianReport);
  app.post("/:id/items", controller.addItem);
  app.post("/:id/items/batch", controller.addItemsBatch);
  app.post("/:id/defects", controller.registerDefect);
}

