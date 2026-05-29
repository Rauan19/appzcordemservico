import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { HttpError } from "./http-errors.ts";

function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError || (err instanceof Error && err.name === "ZodError");
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, _req, reply) => {
    if (isZodError(err)) {
      const message = formatZodMessage(err);
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message,
        issues: err.issues,
      });
    }

    if (err instanceof HttpError) {
      return reply.status(err.statusCode).send({
        error: err.code,
        message: err.message,
      });
    }

    if (err && typeof err === "object" && "code" in err) {
      // Fastify errors sometimes have "code"
    }

    app.log.error(err);
    return reply.status(500).send({ error: "INTERNAL_SERVER_ERROR" });
  });
}

function formatZodMessage(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Dados inválidos";
  const field = issue.path[0];
  if (field === "password") return "Senha deve ter pelo menos 4 caracteres";
  if (field === "email") return "E-mail inválido";
  return issue.message;
}

