import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import {
  ContractTemplateIdParamsSchema,
  CreateContractTemplateSchema,
  UpdateContractTemplateSchema,
} from "./contract-template.schemas.ts";
import { ContractTemplateService } from "./contract-template.service.ts";

export class ContractTemplateController {
  constructor(private readonly service = new ContractTemplateService()) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const activeOnly =
      req.query && "active" in req.query && req.query.active === "true";
    const list = await this.service.list(activeOnly);
    return reply.send(list);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractTemplateIdParamsSchema.parse(req.params);
    const item = await this.service.getById(id);
    return reply.send(item);
  };

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateContractTemplateSchema.parse(req.body);
    const user = req.user as JwtUser;
    const item = await this.service.create({
      ...body,
      createdById: user.sub,
    });
    return reply.status(201).send(item);
  };

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractTemplateIdParamsSchema.parse(req.params);
    const body = UpdateContractTemplateSchema.parse(req.body);
    const item = await this.service.update(id, body);
    return reply.send(item);
  };
}
