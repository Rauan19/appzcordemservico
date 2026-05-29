import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import {
  CreateProductSchema,
  ProductIdParamsSchema,
  ProductIntakeSchema,
  ProductSuggestQuerySchema,
  UpdateProductSchema,
} from "./product.schemas.ts";
import { ProductService } from "./product.service.ts";

export class ProductController {
  constructor(private readonly service = new ProductService()) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateProductSchema.parse(req.body);
    const product = await this.service.create(body);
    return reply.status(201).send(product);
  };

  intake = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = ProductIntakeSchema.parse(req.body);
    const user = req.user as JwtUser;
    const result = await this.service.intake(body, user.sub);
    return reply.status(201).send(result);
  };

  suggest = async (req: FastifyRequest, reply: FastifyReply) => {
    const { q } = ProductSuggestQuerySchema.parse(req.query);
    const products = await this.service.suggest(q);
    return reply.send(products);
  };

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const products = await this.service.list();
    return reply.send(products);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ProductIdParamsSchema.parse(req.params);
    const product = await this.service.getById(id);
    return reply.send(product);
  };

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ProductIdParamsSchema.parse(req.params);
    const body = UpdateProductSchema.parse(req.body);
    const product = await this.service.update(id, body);
    return reply.send(product);
  };

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ProductIdParamsSchema.parse(req.params);
    const result = await this.service.delete(id);
    return reply.send(result);
  };
}
