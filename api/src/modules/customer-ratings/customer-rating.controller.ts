import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { CreateCustomerRatingSchema } from "./customer-rating.schemas.ts";
import { CustomerRatingService } from "./customer-rating.service.ts";

export class CustomerRatingController {
  constructor(private readonly service = new CustomerRatingService()) {}

  listMine = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as JwtUser;
    const list = await this.service.listMine(user.sub);
    return reply.send(list);
  };

  rateableOrders = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as JwtUser;
    const orders = await this.service.listRateableOrders(user.sub);
    return reply.send(orders);
  };

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateCustomerRatingSchema.parse(req.body);
    const user = req.user as JwtUser;
    const created = await this.service.create(user.sub, body);
    return reply.status(201).send(created);
  };
}
