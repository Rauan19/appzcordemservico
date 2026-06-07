import type { FastifyInstance } from "fastify";
import { StockController } from "./stock.controller.ts";

export async function stockRoutes(app: FastifyInstance) {
  const controller = new StockController();

  app.get("/balance", controller.balance);
  app.get("/movements", controller.listMovements);
  app.post("/movements", controller.createMovement);
  app.post("/set-balance", controller.setBalance);
}

