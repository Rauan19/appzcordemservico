import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import {
  CreateStockMovementSchema,
  ListStockMovementsQuerySchema,
  SetStockBalanceSchema,
  StockBalanceQuerySchema,
} from "./stock.schemas.ts";
import { StockService } from "./stock.service.ts";

export class StockController {
  constructor(private readonly service = new StockService()) {}

  createMovement = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateStockMovementSchema.parse(req.body);
    const user = req.user as JwtUser;
    const movement = await this.service.createMovement({ ...body, userId: user.sub });
    return reply.status(201).send(movement);
  };

  listMovements = async (req: FastifyRequest, reply: FastifyReply) => {
    const filters = ListStockMovementsQuerySchema.parse(req.query);
    const movements = await this.service.listMovements(filters);
    return reply.send(movements);
  };

  balance = async (req: FastifyRequest, reply: FastifyReply) => {
    const { productId } = StockBalanceQuerySchema.parse(req.query);
    const bal = await this.service.balance(productId);
    return reply.send(bal);
  };

  setBalance = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = SetStockBalanceSchema.parse(req.body);
    const user = req.user as JwtUser;
    const result = await this.service.setProductBalance({ ...body, userId: user.sub });
    return reply.send(result);
  };
}

