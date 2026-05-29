import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateCustomerSchema, CustomerIdParamsSchema } from "./customer.schemas.ts";
import { CustomerService } from "./customer.service.ts";

export class CustomerController {
  constructor(private readonly service = new CustomerService()) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateCustomerSchema.parse(req.body);
    const customer = await this.service.create(body);
    return reply.status(201).send(customer);
  };

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const customers = await this.service.list();
    return reply.send(customers);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = CustomerIdParamsSchema.parse(req.params);
    const customer = await this.service.getById(id);
    return reply.send(customer);
  };
}

