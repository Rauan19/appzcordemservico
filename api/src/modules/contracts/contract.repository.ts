import type { ContractStatus } from "@prisma/client";
import { prisma } from "../../db.js";

const contractInclude = {
  customer: {
    include: { addresses: { take: 1, orderBy: { createdAt: "asc" as const } } },
  },
  template: { select: { id: true, name: true, version: true } },
  documents: true,
  signature: true,
  serviceOrder: { select: { id: true, code: true, title: true } },
  createdBy: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
};

export class ContractRepository {
  async list(filters: {
    status?: ContractStatus;
    customerId?: string;
    q?: string;
  }) {
    const q = filters.q?.trim();
    return prisma.contract.findMany({
      where: {
        status: filters.status,
        customerId: filters.customerId,
        ...(q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { customer: { fullName: { contains: q, mode: "insensitive" } } },
                { customer: { cpf: { contains: q } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: contractInclude,
    });
  }

  async findById(id: string) {
    return prisma.contract.findUnique({
      where: { id },
      include: contractInclude,
    });
  }

  async findByToken(token: string) {
    return prisma.contract.findUnique({
      where: { accessToken: token },
      include: contractInclude,
    });
  }

  async create(data: {
    code: string;
    customerId: string;
    templateId: string;
    title: string;
    content: string;
    variables?: Record<string, string>;
    serviceOrderId?: string;
    expiresAt?: Date;
    createdById?: string;
  }) {
    return prisma.contract.create({
      data: {
        code: data.code,
        customerId: data.customerId,
        templateId: data.templateId,
        title: data.title,
        content: data.content,
        variables: data.variables,
        serviceOrderId: data.serviceOrderId,
        expiresAt: data.expiresAt,
        createdById: data.createdById,
      },
      include: contractInclude,
    });
  }

  async updateStatus(
    id: string,
    data: {
      status?: ContractStatus;
      sentAt?: Date;
      openedAt?: Date;
      signedAt?: Date | null;
      approvedAt?: Date | null;
      reviewedById?: string | null;
      reviewNote?: string | null;
    },
  ) {
    return prisma.contract.update({
      where: { id },
      data,
      include: contractInclude,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      variables?: Record<string, string>;
      expiresAt?: Date;
    },
  ) {
    return prisma.contract.update({
      where: { id },
      data,
      include: contractInclude,
    });
  }

  async upsertDocument(data: {
    contractId: string;
    type: "ID_FRONT" | "ID_BACK" | "SELFIE_WITH_ID";
    fileKey: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    return prisma.contractDocument.upsert({
      where: {
        contractId_type: {
          contractId: data.contractId,
          type: data.type,
        },
      },
      create: data,
      update: {
        fileKey: data.fileKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      },
    });
  }

  async createSignature(data: {
    contractId: string;
    signatureFileKey?: string;
    signerName: string;
    signerCpf: string;
    ipAddress?: string;
    userAgent?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return prisma.contractSignature.create({ data });
  }
}
