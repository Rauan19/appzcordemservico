import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env, isCorsOriginAllowed } from "./env.js";
import { registerRoutes } from "./http/routes.ts";
import { registerErrorHandler } from "./http/error-handler.ts";
import { registerJwt } from "./plugins/jwt.ts";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (isCorsOriginAllowed(origin, env.corsOrigins)) {
        cb(null, true);
        return;
      }
      app.log.warn({ origin }, "CORS: origem não permitida");
      cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  await app.register(registerJwt);
  registerErrorHandler(app);
  await app.register(registerRoutes);

  app.get("/health", async () => ({ ok: true, env: env.NODE_ENV ?? "dev" }));

  return app;
}
