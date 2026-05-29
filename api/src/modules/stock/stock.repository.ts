import { prisma } from "../../db.js";

export class StockRepository {
  async createMovement(data: {
    type: "IN" | "OUT_SERVICE_ORDER" | "ADJUSTMENT" | "RETURN" | "DEFECT";
    productId: string;
    serviceOrderId?: string;
    userId?: string;
    quantity: string; // Decimal
    reason?: string;
    note?: string;
  }) {
    return prisma.stockMovement.create({ data });
  }

  async balanceByProduct(productId?: string) {
    const where = productId ? { productId } : undefined;

    const rows = await prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      where,
      _sum: { quantity: true },
    });

    const map = new Map<string, { in: number; out: number; adj: number; ret: number; defect: number }>();
    for (const r of rows) {
      const entry =
        map.get(r.productId) ?? { in: 0, out: 0, adj: 0, ret: 0, defect: 0 };
      const sum = Number(r._sum.quantity ?? 0);
      if (r.type === "IN") entry.in += sum;
      else if (r.type === "OUT_SERVICE_ORDER") entry.out += sum;
      else if (r.type === "ADJUSTMENT") entry.adj += sum;
      else if (r.type === "RETURN") entry.ret += sum;
      else if (r.type === "DEFECT") entry.defect += sum;
      map.set(r.productId, entry);
    }

    return [...map.entries()].map(([pid, v]) => ({
      productId: pid,
      balance: v.in + v.ret + v.adj - v.out - v.defect,
      breakdown: v,
    }));
  }

  async balanceForProduct(productId: string): Promise<number> {
    const rows = await this.balanceByProduct(productId);
    return rows[0]?.balance ?? 0;
  }

  async listMovements(filters?: { productId?: string; serviceOrderId?: string }) {
    return prisma.stockMovement.findMany({
      where: {
        ...(filters?.productId ? { productId: filters.productId } : {}),
        ...(filters?.serviceOrderId ? { serviceOrderId: filters.serviceOrderId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user: { select: { id: true, name: true, email: true } },
        serviceOrder: { select: { id: true, code: true, title: true } },
      },
      take: 200,
    });
  }
}

