import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import {
  AddServiceOrderItemSchema,
  AddServiceOrderItemsBatchSchema,
  CreateServiceOrderSchema,
  ListServiceOrdersQuerySchema,
  RegisterDefectSchema,
  ServiceOrderIdParamsSchema,
  UpdateServiceOrderStatusSchema,
} from "./service-order.schemas.ts";
import { ServiceOrderService } from "./service-order.service.ts";

export class ServiceOrderController {
  constructor(private readonly service = new ServiceOrderService()) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateServiceOrderSchema.parse(req.body);
    const so = await this.service.create(body);
    return reply.status(201).send(so);
  };

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = ListServiceOrdersQuerySchema.parse(req.query);
    const user = req.user as JwtUser;

    const filters: { status?: string; assignedToId?: string } = {};
    if (query.status) filters.status = query.status;
    if (query.assignedTo === "me") filters.assignedToId = user.sub;

    const list = await this.service.list(filters);
    return reply.send(list);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceOrderIdParamsSchema.parse(req.params);
    const so = await this.service.getById(id);
    return reply.send(so);
  };

  updateStatus = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceOrderIdParamsSchema.parse(req.params);
    const { status } = UpdateServiceOrderStatusSchema.parse(req.body);
    const updated = await this.service.updateStatus(id, status);
    return reply.send(updated);
  };

  addItem = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceOrderIdParamsSchema.parse(req.params);
    const body = AddServiceOrderItemSchema.parse(req.body);
    const user = req.user as JwtUser;
    const result = await this.service.addItem(id, { ...body, userId: user.sub });
    return reply.status(201).send(result);
  };

  addItemsBatch = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceOrderIdParamsSchema.parse(req.params);
    const body = AddServiceOrderItemsBatchSchema.parse(req.body);
    const user = req.user as JwtUser;
    const items = await this.service.addItems(
      id,
      body.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        description: item.description,
      })),
      { reason: body.reason, userId: user.sub },
    );
    return reply.status(201).send({ items });
  };

  registerDefect = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceOrderIdParamsSchema.parse(req.params);
    const body = RegisterDefectSchema.parse(req.body);
    const user = req.user as JwtUser;
    const movement = await this.service.registerDefect(id, { ...body, userId: user.sub });
    return reply.status(201).send(movement);
  };
}

