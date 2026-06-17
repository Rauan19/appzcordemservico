import { prisma } from "../../db.js";

export class ContractTemplateRepository {
  async list(activeOnly = false) {
    return prisma.contractTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: "asc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { contracts: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async create(data: {
    name: string;
    content: string;
    active?: boolean;
    createdById?: string;
  }) {
    return prisma.contractTemplate.create({
      data: {
        name: data.name,
        content: data.content,
        active: data.active ?? true,
        createdById: data.createdById,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; content?: string; active?: boolean },
  ) {
    return prisma.contractTemplate.update({
      where: { id },
      data,
    });
  }
}
