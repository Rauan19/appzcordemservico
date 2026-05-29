import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { CreateEvaluationSchema, ListEvaluationsQuerySchema } from "./evaluation.schemas.ts";
import { EvaluationService } from "./evaluation.service.ts";

export class EvaluationController {
  constructor(private readonly service = new EvaluationService()) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = ListEvaluationsQuerySchema.parse(req.query);
    const list = await this.service.list(query);
    return reply.send(list);
  };

  stats = async (_req: FastifyRequest, reply: FastifyReply) => {
    const stats = await this.service.getStats();
    return reply.send(stats);
  };

  evaluableOrders = async (_req: FastifyRequest, reply: FastifyReply) => {
    const orders = await this.service.listEvaluableOrders();
    return reply.send(orders);
  };

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateEvaluationSchema.parse(req.body);
    const user = req.user as JwtUser;
    const created = await this.service.create(body, user.sub);
    return reply.status(201).send(created);
  };
}
