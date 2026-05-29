import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateServiceCatalogSchema,
  ServiceCatalogIdParamsSchema,
  UpdateServiceCatalogSchema,
} from "./service-catalog.schemas.ts";
import { ServiceCatalogService } from "./service-catalog.service.ts";

export class ServiceCatalogController {
  constructor(private readonly service = new ServiceCatalogService()) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateServiceCatalogSchema.parse(req.body);
    const item = await this.service.create(body);
    return reply.status(201).send(item);
  };

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const activeOnly = req.query && "active" in req.query && req.query.active === "true";
    const list = await this.service.list(activeOnly);
    return reply.send(list);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceCatalogIdParamsSchema.parse(req.params);
    const item = await this.service.getById(id);
    return reply.send(item);
  };

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ServiceCatalogIdParamsSchema.parse(req.params);
    const body = UpdateServiceCatalogSchema.parse(req.body);
    const item = await this.service.update(id, body);
    return reply.send(item);
  };
}
