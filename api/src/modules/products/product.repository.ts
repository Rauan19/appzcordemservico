import { prisma } from "../../db.js";

export class ProductRepository {
  async create(data: {
    name: string;
    series?: string;
    sku?: string;
    unit: string;
    active?: boolean;
  }) {
    return prisma.product.create({ data });
  }

  async list() {
    return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } });
  }

  async search(query: string, limit = 8) {
    const q = query.trim();
    return prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { series: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  }

  async findSimilar(name: string, series?: string) {
    const normalizedName = name.trim();
    const normalizedSeries = series?.trim() || null;

    if (normalizedSeries) {
      return prisma.product.findMany({
        where: {
          active: true,
          name: { equals: normalizedName, mode: "insensitive" },
          series: { equals: normalizedSeries, mode: "insensitive" },
        },
        take: 1,
      });
    }

    return prisma.product.findMany({
      where: {
        active: true,
        name: { equals: normalizedName, mode: "insensitive" },
        OR: [{ series: null }, { series: "" }],
      },
      take: 1,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      series?: string | null;
      sku?: string | null;
      unit?: string;
      active?: boolean;
    },
  ) {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async countUsage(id: string) {
    const [movements, items] = await Promise.all([
      prisma.stockMovement.count({ where: { productId: id } }),
      prisma.serviceOrderItem.count({ where: { productId: id } }),
    ]);
    return movements + items;
  }
}
