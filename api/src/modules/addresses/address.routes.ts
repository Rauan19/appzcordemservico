import type { FastifyInstance } from "fastify";
import { AddressController } from "./address.controller.ts";

export async function addressRoutes(app: FastifyInstance) {
  const controller = new AddressController();

  app.get("/", controller.list);
  app.get("/:id", controller.getById);
  app.post("/", controller.create);
}
