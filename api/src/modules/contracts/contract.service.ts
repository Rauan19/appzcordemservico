import type { ContractStatus } from "@prisma/client";
import {
  BadRequestError,
  NotFoundError,
} from "../../http/http-errors.ts";
import {
  contractFileKey,
  extensionForMime,
  readUploadFile,
  saveUploadFile,
} from "../../infra/local-storage.ts";
import { prisma } from "../../db.js";
import {
  buildCustomerVariables,
  nextContractCode,
  renderContractContent,
} from "./contract-render.ts";
import { ContractRepository } from "./contract.repository.ts";
import { ContractTemplateRepository } from "./contract-template.repository.ts";

const SIGNABLE_STATUSES: ContractStatus[] = ["SENT", "OPENED", "DOCS_SUBMITTED"];

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

function parseSignatureBase64(raw: string) {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i.exec(raw);
  const base64 = match ? match[2]! : raw;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength < 100) {
    throw new BadRequestError("Assinatura inválida");
  }
  const mimeType = match
    ? `image/${match[1]!.toLowerCase() === "jpg" ? "jpeg" : match[1]!.toLowerCase()}`
    : "image/png";
  return { buffer, mimeType };
}

export class ContractService {
  constructor(
    private readonly repo = new ContractRepository(),
    private readonly templateRepo = new ContractTemplateRepository(),
  ) {}

  list(filters: { status?: ContractStatus; customerId?: string; q?: string }) {
    return this.repo.list(filters);
  }

  async getById(id: string) {
    const contract = await this.repo.findById(id);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    return contract;
  }

  private assertNotExpired(contract: { expiresAt: Date | null; status: ContractStatus }) {
    if (contract.expiresAt && contract.expiresAt < new Date()) {
      throw new BadRequestError("Link do contrato expirado");
    }
    if (contract.status === "EXPIRED") {
      throw new BadRequestError("Contrato expirado");
    }
  }

  async create(input: {
    customerId: string;
    templateId: string;
    title?: string;
    variables?: Record<string, string>;
    serviceOrderId?: string;
    expiresInDays?: number;
    createdById?: string;
  }) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      include: { addresses: { take: 1, orderBy: { createdAt: "asc" } } },
    });
    if (!customer) throw new NotFoundError("Cliente não encontrado");

    const template = await this.templateRepo.findById(input.templateId);
    if (!template || !template.active) {
      throw new NotFoundError("Modelo de contrato não encontrado ou inativo");
    }

    const variables = buildCustomerVariables(customer, input.variables);
    const content = renderContractContent(template.content, variables);
    const code = await nextContractCode();
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.repo.create({
      code,
      customerId: input.customerId,
      templateId: input.templateId,
      title: input.title ?? `Contrato  ${customer.fullName}`,
      content,
      variables,
      serviceOrderId: input.serviceOrderId,
      expiresAt,
      createdById: input.createdById,
    });
  }

  async send(id: string) {
    const contract = await this.getById(id);
    if (contract.status !== "DRAFT" && contract.status !== "REJECTED" && contract.status !== "SIGNED") {
      throw new BadRequestError("Contrato não pode ser enviado neste status");
    }

    if (contract.status === "REJECTED" || contract.status === "SIGNED") {
      await prisma.contractSignature.deleteMany({ where: { contractId: id } });
      await prisma.contractDocument.deleteMany({ where: { contractId: id } });
    }

    return this.repo.updateStatus(id, {
      status: "SENT",
      sentAt: new Date(),
      reviewNote: null,
      signedAt: null,
      approvedAt: null,
      reviewedById: null,
    });
  }

  async update(
    id: string,
    input: {
      title?: string;
      content?: string;
      variables?: Record<string, string>;
      expiresInDays?: number;
    },
  ) {
    const contract = await this.getById(id);
    if (["SIGNED", "APPROVED", "CANCELED"].includes(contract.status)) {
      throw new BadRequestError(
        "Contrato já assinado/aprovado. Gere um link de edição para o cliente refazer.",
      );
    }

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    return this.repo.update(id, {
      title: input.title,
      content: input.content,
      variables: input.variables,
      expiresAt,
    });
  }

  async approve(id: string, reviewedById: string) {
    const contract = await this.getById(id);
    if (contract.status !== "SIGNED") {
      throw new BadRequestError("Somente contratos assinados podem ser aprovados");
    }
    return this.repo.updateStatus(id, {
      status: "APPROVED",
      approvedAt: new Date(),
      reviewedById,
      reviewNote: null,
    });
  }

  async reject(id: string, reviewedById: string, reviewNote: string) {
    const contract = await this.getById(id);
    if (contract.status !== "SIGNED") {
      throw new BadRequestError("Somente contratos assinados podem ser rejeitados");
    }
    return this.repo.updateStatus(id, {
      status: "REJECTED",
      reviewedById,
      reviewNote,
    });
  }

  async cancel(id: string) {
    const contract = await this.getById(id);
    if (["APPROVED", "CANCELED"].includes(contract.status)) {
      throw new BadRequestError("Contrato não pode ser cancelado");
    }
    return this.repo.updateStatus(id, { status: "CANCELED" });
  }

  buildSigningUrl(accessToken: string) {
    const base = process.env.PUBLIC_WEB_URL?.trim() || "http://localhost:5173";
    return `${base.replace(/\/$/, "")}/assinatura/${accessToken}`;
  }

  async getPublicByToken(token: string) {
    const contract = await this.repo.findByToken(token);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    if (contract.status === "CANCELED") {
      throw new BadRequestError("Contrato cancelado");
    }
    this.assertNotExpired(contract);

    if (contract.status === "SENT") {
      await this.repo.updateStatus(contract.id, {
        status: "OPENED",
        openedAt: new Date(),
      });
      contract.status = "OPENED";
      contract.openedAt = new Date();
    }

    const requiredTypes = ["ID_FRONT", "ID_BACK", "SELFIE_WITH_ID"] as const;

    return {
      id: contract.id,
      code: contract.code,
      title: contract.title,
      content: contract.content,
      status: contract.status,
      expiresAt: contract.expiresAt,
      customerName: contract.customer.fullName,
      variables: contract.variables,
      documents: requiredTypes.map((type) => ({
        type,
        uploaded: contract.documents.some((d) => d.type === type),
      })),
      signed: !!contract.signature,
      signature: contract.signature
        ? {
            signerName: contract.signature.signerName,
            signerCpf: contract.signature.signerCpf,
            signedAt: contract.signature.signedAt,
            ipAddress: contract.signature.ipAddress,
          }
        : null,
    };
  }

  async uploadDocument(
    token: string,
    type: "ID_FRONT" | "ID_BACK" | "SELFIE_WITH_ID",
    buffer: Buffer,
    mimeType: string,
  ) {
    const contract = await this.repo.findByToken(token);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    if (!SIGNABLE_STATUSES.includes(contract.status)) {
      throw new BadRequestError("Upload não permitido neste status");
    }
    this.assertNotExpired(contract);

    const ext = extensionForMime(mimeType);
    const filename = `${type.toLowerCase().replace(/_/g, "-")}.${ext}`;
    const fileKey = contractFileKey(contract.id, filename);
    await saveUploadFile(fileKey, buffer, mimeType);

    const doc = await this.repo.upsertDocument({
      contractId: contract.id,
      type,
      fileKey,
      mimeType,
      sizeBytes: buffer.byteLength,
    });

    const docsCount = await prisma.contractDocument.count({
      where: { contractId: contract.id },
    });

    if (docsCount >= 3 && contract.status !== "DOCS_SUBMITTED") {
      await this.repo.updateStatus(contract.id, { status: "DOCS_SUBMITTED" });
    }

    return doc;
  }

  async sign(
    token: string,
    input: {
      signerName: string;
      signerCpf: string;
      signatureBase64: string;
      ipAddress?: string;
      userAgent?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const contract = await this.repo.findByToken(token);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    if (!SIGNABLE_STATUSES.includes(contract.status) && contract.status !== "DOCS_SUBMITTED") {
      if (contract.status === "SIGNED" || contract.status === "APPROVED") {
        throw new BadRequestError("Contrato já assinado");
      }
      throw new BadRequestError("Assinatura não permitida neste status");
    }
    this.assertNotExpired(contract);

    const docsCount = await prisma.contractDocument.count({
      where: { contractId: contract.id },
    });
    if (docsCount < 3) {
      throw new BadRequestError("Envie as 3 fotos do documento antes de assinar");
    }

    const customerCpf = normalizeCpf(contract.customer.cpf);
    const signerCpf = normalizeCpf(input.signerCpf);
    if (customerCpf !== signerCpf) {
      throw new BadRequestError("CPF informado não confere com o do contrato");
    }

    if (contract.signature) {
      throw new BadRequestError("Contrato já assinado");
    }

    const { buffer, mimeType } = parseSignatureBase64(input.signatureBase64);
    const ext = extensionForMime(mimeType);
    const fileKey = contractFileKey(contract.id, `signature.${ext}`);
    await saveUploadFile(fileKey, buffer, mimeType);

    await this.repo.createSignature({
      contractId: contract.id,
      signatureFileKey: fileKey,
      signerName: input.signerName.trim(),
      signerCpf: signerCpf,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    return this.repo.updateStatus(contract.id, {
      status: "SIGNED",
      signedAt: new Date(),
    });
  }

  async getDocumentFile(contractId: string, type: "ID_FRONT" | "ID_BACK" | "SELFIE_WITH_ID") {
    const contract = await this.getById(contractId);
    const doc = contract.documents.find((d) => d.type === type);
    if (!doc) throw new NotFoundError("Documento não encontrado");
    const buffer = await readUploadFile(doc.fileKey);
    return { buffer, mimeType: doc.mimeType };
  }

  async getSignatureFile(contractId: string) {
    const contract = await this.getById(contractId);
    if (!contract.signature?.signatureFileKey) {
      throw new NotFoundError("Assinatura não encontrada");
    }
    const buffer = await readUploadFile(contract.signature.signatureFileKey);
    return { buffer, mimeType: "image/png" };
  }

  async getPublicDocumentFile(
    token: string,
    type: "ID_FRONT" | "ID_BACK" | "SELFIE_WITH_ID",
  ) {
    const contract = await this.repo.findByToken(token);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    const doc = contract.documents.find((d) => d.type === type);
    if (!doc) throw new NotFoundError("Documento não encontrado");
    const buffer = await readUploadFile(doc.fileKey);
    return { buffer, mimeType: doc.mimeType };
  }

  async getPublicSignatureFile(token: string) {
    const contract = await this.repo.findByToken(token);
    if (!contract) throw new NotFoundError("Contrato não encontrado");
    if (!contract.signature?.signatureFileKey) {
      throw new NotFoundError("Assinatura não encontrada");
    }
    const buffer = await readUploadFile(contract.signature.signatureFileKey);
    return { buffer, mimeType: "image/png" };
  }
}
