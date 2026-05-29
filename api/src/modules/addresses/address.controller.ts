import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AddressIdParamsSchema,
  CreateAddressSchema,
  CustomerIdParamsSchema,
} from "./address.schemas.ts";
import { AddressService } from "./address.service.ts";

export class AddressController {
  constructor(private readonly service = new AddressService()) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const { customerId } = CustomerIdParamsSchema.parse(req.params);
    const body = CreateAddressSchema.parse(req.body);
    const address = await this.service.create(customerId, body);
    return reply.status(201).send(address);
  };

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { customerId } = CustomerIdParamsSchema.parse(req.params);
    const addresses = await this.service.list(customerId);
    return reply.send(addresses);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { customerId, id } = AddressIdParamsSchema.parse(req.params);
    const address = await this.service.getById(customerId, id);
    return reply.send(address);
  };
}
