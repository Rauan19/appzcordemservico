import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { CustomerRatingController } from "./customer-rating.controller.ts";

const technicianOnly = { onRequest: [requireRoles("TECHNICIAN")] };

export async function customerRatingRoutes(app: FastifyInstance) {
  const controller = new CustomerRatingController();

  app.get("/my", technicianOnly, controller.listMine);
  app.get("/rateable-orders", technicianOnly, controller.rateableOrders);
  app.post("/", technicianOnly, controller.create);
}
