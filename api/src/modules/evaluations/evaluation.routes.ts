import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { EvaluationController } from "./evaluation.controller.ts";

const managerUp = { onRequest: [requireRoles("ADMIN", "MANAGER")] };

export async function evaluationRoutes(app: FastifyInstance) {
  const controller = new EvaluationController();

  app.get("/", managerUp, controller.list);
  app.get("/stats", managerUp, controller.stats);
  app.get("/evaluable-orders", managerUp, controller.evaluableOrders);
  app.post("/", managerUp, controller.create);
}
