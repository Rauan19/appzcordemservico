import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError, ForbiddenError } from "./http-errors.ts";

export type JwtUser = {
  sub: string;
  role: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN";
  email: string;
};

export async function authenticate(req: FastifyRequest, _reply: FastifyReply) {
  try {
    await req.jwtVerify<JwtUser>();
  } catch {
    throw new UnauthorizedError("Token inválido ou ausente");
  }
}

export function requireRoles(...roles: JwtUser["role"][]) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const user = req.user as JwtUser;
    if (!roles.includes(user.role)) {
      throw new ForbiddenError();
    }
  };
}
