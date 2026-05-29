import type { FastifyInstance } from "fastify";
import { CustomerController } from "./customer.controller.ts";

export async function customerRoutes(app: FastifyInstance) {
  const controller = new CustomerController();

  app.get("/", controller.list);
  app.get("/:id", controller.getById);
  app.post("/", controller.create);
}

