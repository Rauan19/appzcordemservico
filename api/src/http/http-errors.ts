export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message?: string) {
    super(message ?? code);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Não encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflito") {
    super(409, "CONFLICT", message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Requisição inválida") {
    super(400, "BAD_REQUEST", message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Não autorizado") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Sem permissão") {
    super(403, "FORBIDDEN", message);
  }
}
