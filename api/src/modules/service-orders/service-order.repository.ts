import { prisma } from "../../db.js";
import { serviceOrderAssigneeInclude } from "./service-order.includes.ts";

const orderInclude = {
  customer: true,
  address: true,
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  ...serviceOrderAssigneeInclude,
  customerRating: {
    select: { id: true, rating: true, comment: true, createdAt: true },
  },
};

export class ServiceOrderRepository {
  async create(data: {
    code: string;
    customerId: string;
    addressId?: string;
    assignedToId?: string;
    assignedToIds?: string[];
    status?: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
    title: string;
    description?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    scheduledAt?: Date;
  }) {
    const assigneeIds = data.assignedToIds ?? [];
    const primaryId = data.assignedToId ?? assigneeIds[0];

    return prisma.serviceOrder.create({
      data: {
        code: data.code,
        customerId: data.customerId,
        addressId: data.addressId,
        assignedToId: primaryId,
        status: data.status,
        title: data.title,
        description: data.description,
        priority: data.priority,
        scheduledAt: data.scheduledAt,
        ...(assigneeIds.length > 0
          ? {
              assignees: {
                create: assigneeIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: orderInclude,
    });
  }

  async list(filters?: { status?: string; assignedToId?: string }) {
    return prisma.serviceOrder.findMany({
      where: {
        ...(filters?.status ? { status: filters.status as never } : {}),
        ...(filters?.assignedToId
          ? {
              OR: [
                { assignedToId: filters.assignedToId },
                { assignees: { some: { userId: filters.assignedToId } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
  }

  async findById(id: string) {
    return prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        ...orderInclude,
        items: { include: { product: true } },
        stockMovements: true,
      },
    });
  }

  async updateStatus(id: string, status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELED") {
    const now = new Date();
    const current = await prisma.serviceOrder.findUnique({ where: { id } });
    return prisma.serviceOrder.update({
      where: { id },
      data: {
        status,
        startedAt:
          status === "IN_PROGRESS" && !current?.startedAt ? now : undefined,
        finishedAt: status === "DONE" ? now : undefined,
      },
      include: {
        ...orderInclude,
        items: { include: { product: true } },
      },
    });
  }

  async addItemWithStockOut(data: {
    serviceOrderId: string;
    productId: string;
    quantity: string;
    description?: string;
    reason?: string;
    userId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.serviceOrderItem.create({
        data: {
          serviceOrderId: data.serviceOrderId,
          productId: data.productId,
          quantity: data.quantity,
          description: data.description,
        },
        include: { product: true },
      });

      const movement = await tx.stockMovement.create({
        data: {
          type: "OUT_SERVICE_ORDER",
          productId: data.productId,
          serviceOrderId: data.serviceOrderId,
          userId: data.userId,
          quantity: data.quantity,
          reason: data.reason ?? "Uso na OS",
        },
      });

      return { item, movement };
    });
  }

  async addItemsWithStockOutBatch(data: {
    serviceOrderId: string;
    userId?: string;
    reason?: string;
    items: Array<{
      productId: string;
      quantity: string;
      description?: string;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of data.items) {
        const created = await tx.serviceOrderItem.create({
          data: {
            serviceOrderId: data.serviceOrderId,
            productId: item.productId,
            quantity: item.quantity,
            description: item.description,
          },
          include: { product: true },
        });

        await tx.stockMovement.create({
          data: {
            type: "OUT_SERVICE_ORDER",
            productId: item.productId,
            serviceOrderId: data.serviceOrderId,
            userId: data.userId,
            quantity: item.quantity,
            reason: data.reason ?? "Uso na OS",
          },
        });

        results.push(created);
      }
      return results;
    });
  }

  async registerDefectMovement(data: {
    serviceOrderId: string;
    productId: string;
    quantity: string;
    reason: string;
    note?: string;
    userId?: string;
  }) {
    return prisma.stockMovement.create({
      data: {
        type: "DEFECT",
        productId: data.productId,
        serviceOrderId: data.serviceOrderId,
        userId: data.userId,
        quantity: data.quantity,
        reason: data.reason,
        note: data.note,
      },
    });
  }
}
