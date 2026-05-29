import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { env } from "../env.ts";

export const registerJwt = fp(async (app: FastifyInstance) => {
  await app.register(fjwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });
});
