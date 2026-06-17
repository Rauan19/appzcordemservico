import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { BadRequestError } from "../../http/http-errors.ts";
import {
  ContractDocumentTypeParamSchema,
  ContractIdParamsSchema,
  ContractTokenParamsSchema,
  CreateContractSchema,
  ListContractsQuerySchema,
  RejectContractSchema,
  SignContractSchema,
  UpdateContractSchema,
} from "./contract.schemas.ts";
import { ContractService } from "./contract.service.ts";

export class ContractController {
  constructor(private readonly service = new ContractService()) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = ListContractsQuerySchema.parse(req.query ?? {});
    const list = await this.service.list(query);
    return reply.send(list);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const contract = await this.service.getById(id);
    const signingUrl = this.service.buildSigningUrl(contract.accessToken);
    return reply.send({ ...contract, signingUrl });
  };

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateContractSchema.parse(req.body);
    const user = req.user as JwtUser;
    const contract = await this.service.create({
      ...body,
      createdById: user.sub,
    });
    return reply.status(201).send(contract);
  };

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const body = UpdateContractSchema.parse(req.body);
    const contract = await this.service.update(id, body);
    const signingUrl = this.service.buildSigningUrl(contract.accessToken);
    return reply.send({ ...contract, signingUrl });
  };

  send = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const contract = await this.service.send(id);
    const signingUrl = this.service.buildSigningUrl(contract.accessToken);
    return reply.send({ ...contract, signingUrl });
  };

  approve = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const user = req.user as JwtUser;
    const contract = await this.service.approve(id, user.sub);
    return reply.send(contract);
  };

  reject = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const body = RejectContractSchema.parse(req.body);
    const user = req.user as JwtUser;
    const contract = await this.service.reject(id, user.sub, body.reviewNote);
    return reply.send(contract);
  };

  cancel = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const contract = await this.service.cancel(id);
    return reply.send(contract);
  };

  getDocument = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const { type } = ContractDocumentTypeParamSchema.parse(req.params);
    const file = await this.service.getDocumentFile(id, type);
    return reply.type(file.mimeType).send(file.buffer);
  };

  getSignature = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = ContractIdParamsSchema.parse(req.params);
    const file = await this.service.getSignatureFile(id);
    return reply.type(file.mimeType).send(file.buffer);
  };

  // --- público ---

  getPublic = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = ContractTokenParamsSchema.parse(req.params);
    const data = await this.service.getPublicByToken(token);
    return reply.send(data);
  };

  uploadPublicDocument = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = ContractTokenParamsSchema.parse(req.params);
    const data = await req.file();
    if (!data) throw new BadRequestError("Arquivo obrigatório");

    const typeField = data.fields.type;
    const typeValue =
      typeField && typeof typeField === "object" && "value" in typeField
        ? String(typeField.value)
        : "";
    const type = ContractDocumentTypeParamSchema.shape.type.safeParse(typeValue);
    if (!type.success) {
      throw new BadRequestError("Tipo de documento inválido");
    }

    const buffer = await data.toBuffer();
    const mimeType = data.mimetype || "image/jpeg";
    const doc = await this.service.uploadDocument(
      token,
      type.data,
      buffer,
      mimeType,
    );
    return reply.status(201).send(doc);
  };

  signPublic = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = ContractTokenParamsSchema.parse(req.params);
    const body = SignContractSchema.parse(req.body);
    const contract = await this.service.sign(token, {
      signerName: body.signerName,
      signerCpf: body.signerCpf,
      signatureBase64: body.signatureBase64,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      latitude: body.latitude,
      longitude: body.longitude,
    });
    return reply.send({ ok: true, status: contract.status });
  };

  getPublicDocument = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = ContractTokenParamsSchema.parse(req.params);
    const { type } = ContractDocumentTypeParamSchema.parse(req.params);
    const file = await this.service.getPublicDocumentFile(token, type);
    return reply.type(file.mimeType).send(file.buffer);
  };

  getPublicSignature = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = ContractTokenParamsSchema.parse(req.params);
    const file = await this.service.getPublicSignatureFile(token);
    return reply.type(file.mimeType).send(file.buffer);
  };
}
