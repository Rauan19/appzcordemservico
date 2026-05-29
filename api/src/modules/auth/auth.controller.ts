import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { BadRequestError } from "../../http/http-errors.ts";
import { CreateUserSchema, LoginSchema } from "./auth.schemas.ts";
import { AuthService } from "./auth.service.ts";

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  login = async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];
      if (field === "password") {
        throw new BadRequestError("Senha deve ter pelo menos 4 caracteres");
      }
      if (field === "email") {
        throw new BadRequestError("E-mail inválido");
      }
      throw new BadRequestError("Informe e-mail e senha válidos");
    }
    const { email, password } = parsed.data;
    const user = await this.service.login(email, password);

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
      email: user.email,
    } satisfies JwtUser);

    return reply.send({ token, user });
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const jwtUser = req.user as JwtUser;
    const user = await this.service.me(jwtUser.sub);
    return reply.send(user);
  };

  createUser = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateUserSchema.parse(req.body);
    const user = await this.service.createUser(body);
    return reply.status(201).send(user);
  };
}
