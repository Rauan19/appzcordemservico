import { prisma } from "../../db.js";

export class ServiceCatalogRepository {
  async create(data: { name: string; description?: string; active?: boolean }) {
    return prisma.serviceCatalog.create({ data });
  }

  async list(activeOnly = false) {
    return prisma.serviceCatalog.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.serviceCatalog.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; description?: string; active?: boolean }) {
    return prisma.serviceCatalog.update({ where: { id }, data });
  }
}
