import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../http/auth.ts";
import { ContractTemplateController } from "./contract-template.controller.ts";
import { ContractController } from "./contract.controller.ts";

const managerOnly = { onRequest: [requireRoles("ADMIN", "MANAGER")] };

export async function contractTemplateRoutes(app: FastifyInstance) {
  const controller = new ContractTemplateController();

  app.get("/", managerOnly, controller.list);
  app.get("/:id", managerOnly, controller.getById);
  app.post("/", managerOnly, controller.create);
  app.patch("/:id", managerOnly, controller.update);
}

export async function contractRoutes(app: FastifyInstance) {
  const controller = new ContractController();

  app.get("/", managerOnly, controller.list);
  app.get("/:id", managerOnly, controller.getById);
  app.post("/", managerOnly, controller.create);
  app.patch("/:id", managerOnly, controller.update);
  app.post("/:id/send", managerOnly, controller.send);
  app.patch("/:id/approve", managerOnly, controller.approve);
  app.patch("/:id/reject", managerOnly, controller.reject);
  app.post("/:id/cancel", managerOnly, controller.cancel);
  app.get("/:id/documents/:type", managerOnly, controller.getDocument);
  app.get("/:id/signature", managerOnly, controller.getSignature);
}

export async function publicContractRoutes(app: FastifyInstance) {
  const controller = new ContractController();

  app.get("/:token", controller.getPublic);
  app.post("/:token/documents", controller.uploadPublicDocument);
  app.post("/:token/sign", controller.signPublic);
  app.get("/:token/documents/:type", controller.getPublicDocument);
  app.get("/:token/signature", controller.getPublicSignature);
}
