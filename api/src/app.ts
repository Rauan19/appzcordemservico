import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerRoutes } from "./http/routes.ts";
import { registerErrorHandler } from "./http/error-handler.ts";
import { registerJwt } from "./plugins/jwt.ts";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(registerJwt);
  registerErrorHandler(app);
  await app.register(registerRoutes);

  app.get("/health", async () => ({ ok: true, env: env.NODE_ENV ?? "dev" }));

  return app;
}

