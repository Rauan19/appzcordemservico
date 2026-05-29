import type { FastifyInstance } from "fastify";
import { ProductController } from "./product.controller.ts";

export async function productRoutes(app: FastifyInstance) {
  const controller = new ProductController();

  app.get("/", controller.list);
  app.get("/suggest", controller.suggest);
  app.post("/intake", controller.intake);
  app.get("/:id", controller.getById);
  app.post("/", controller.create);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.delete);
}

