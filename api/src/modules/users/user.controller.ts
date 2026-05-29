import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { UserService } from "./user.service.ts";
import { UpdateUserActiveSchema, UserIdParamsSchema } from "./user.schemas.ts";

export class UserController {
  constructor(private readonly service = new UserService()) {}

  listTechnicians = async (_req: FastifyRequest, reply: FastifyReply) => {
    const users = await this.service.listTechnicians();
    return reply.send(users);
  };

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const users = await this.service.listAll();
    return reply.send(users);
  };

  setActive = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = UserIdParamsSchema.parse(req.params);
    const { active } = UpdateUserActiveSchema.parse(req.body);
    const requester = req.user as JwtUser;
    const user = await this.service.setActive(requester.sub, id, active);
    return reply.send(user);
  };
}
