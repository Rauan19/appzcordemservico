import type { FastifyInstance } from "fastify";
import { authenticate, requireRoles } from "../../http/auth.ts";
import { AuthController } from "./auth.controller.ts";

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post("/login", controller.login);

  app.get("/me", { onRequest: [authenticate] }, controller.me);

  app.post(
    "/users",
    { onRequest: [authenticate, requireRoles("ADMIN")] },
    controller.createUser,
  );
}
