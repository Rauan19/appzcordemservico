import { prisma } from "../../db.js";
import type { Prisma } from "@prisma/client";
import { serviceOrderAssigneeInclude } from "./service-order.includes.ts";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date: Date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ListServiceOrderFilters = {
  status?: string;
  assignedToId?: string;
  priority?: string;
  technicianId?: string;
  scheduled?: "today" | "scheduled" | "unscheduled" | "overdue";
  createdPeriod?: "day" | "month" | "year";
  q?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  withPppoe?: boolean;
};

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
    customerPppoeUser?: string;
    customerPppoePassword?: string;
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
        customerPppoeUser: data.customerPppoeUser,
        customerPppoePassword: data.customerPppoePassword,
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

  async list(filters?: ListServiceOrderFilters) {
    const and: Prisma.ServiceOrderWhereInput[] = [];

    if (filters?.status) and.push({ status: filters.status as never });
    if (filters?.priority) and.push({ priority: filters.priority as never });

    const technicianId = filters?.technicianId ?? filters?.assignedToId;
    if (technicianId) {
      and.push({
        OR: [
          { assignedToId: technicianId },
          { assignees: { some: { userId: technicianId } } },
        ],
      });
    }

    if (filters?.scheduled === "scheduled") {
      and.push({ scheduledAt: { not: null } });
    } else if (filters?.scheduled === "unscheduled") {
      and.push({ scheduledAt: null });
    } else if (filters?.scheduled === "today") {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      and.push({ scheduledAt: { gte: start, lte: end } });
    } else if (filters?.scheduled === "overdue") {
      and.push({
        scheduledAt: { lt: startOfDay(new Date()) },
        status: { notIn: ["DONE", "CANCELED"] },
      });
    }

    if (filters?.scheduledFrom) {
      and.push({ scheduledAt: { gte: startOfDay(filters.scheduledFrom) } });
    }
    if (filters?.scheduledTo) {
      and.push({ scheduledAt: { lte: endOfDay(filters.scheduledTo) } });
    }

    if (filters?.withPppoe) {
      and.push({
        OR: [
          { customerPppoeUser: { not: null } },
          { customerPppoePassword: { not: null } },
        ],
      });
    }

    if (filters?.q) {
      const q = filters.q.trim();
      and.push({
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { customer: { fullName: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    if (filters?.createdPeriod === "day") {
      const now = new Date();
      and.push({ createdAt: { gte: startOfDay(now), lte: endOfDay(now) } });
    } else if (filters?.createdPeriod === "month") {
      const now = new Date();
      and.push({ createdAt: { gte: startOfMonth(now), lte: endOfDay(now) } });
    } else if (filters?.createdPeriod === "year") {
      const now = new Date();
      and.push({ createdAt: { gte: startOfYear(now), lte: endOfDay(now) } });
    }

    return prisma.serviceOrder.findMany({
      where: and.length > 0 ? { AND: and } : {},
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
  }

  async countCreatedStats() {
    const now = new Date();
    const [day, month, year, total] = await Promise.all([
      prisma.serviceOrder.count({
        where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      }),
      prisma.serviceOrder.count({
        where: { createdAt: { gte: startOfMonth(now), lte: endOfDay(now) } },
      }),
      prisma.serviceOrder.count({
        where: { createdAt: { gte: startOfYear(now), lte: endOfDay(now) } },
      }),
      prisma.serviceOrder.count(),
    ]);
    return { day, month, year, total };
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

  async updateTechnicianReport(id: string, technicianReport: string | null) {
    return prisma.serviceOrder.update({
      where: { id },
      data: { technicianReport },
      include: {
        ...orderInclude,
        items: { include: { product: true } },
      },
    });
  }

  async updateFull(
    id: string,
    data: {
      customerId?: string;
      addressId?: string | null;
      assignedToIds?: string[];
      title?: string;
      description?: string | null;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      status?: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
      scheduledAt?: Date | null;
      customerPppoeUser?: string | null;
      customerPppoePassword?: string | null;
      technicianReport?: string | null;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.assignedToIds !== undefined) {
        await tx.serviceOrderTechnician.deleteMany({ where: { serviceOrderId: id } });
        if (data.assignedToIds.length > 0) {
          await tx.serviceOrderTechnician.createMany({
            data: data.assignedToIds.map((userId) => ({ serviceOrderId: id, userId })),
          });
        }
      }

      const current = await tx.serviceOrder.findUnique({ where: { id } });
      const now = new Date();

      return tx.serviceOrder.update({
        where: { id },
        data: {
          customerId: data.customerId,
          addressId: data.addressId,
          assignedToId:
            data.assignedToIds !== undefined
              ? (data.assignedToIds[0] ?? null)
              : undefined,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          scheduledAt: data.scheduledAt,
          customerPppoeUser: data.customerPppoeUser,
          customerPppoePassword: data.customerPppoePassword,
          technicianReport: data.technicianReport,
          startedAt:
            data.status === "IN_PROGRESS" && !current?.startedAt ? now : undefined,
          finishedAt: data.status === "DONE" ? now : undefined,
        },
        include: {
          ...orderInclude,
          items: { include: { product: true } },
        },
      });
    });
  }

  async deleteById(id: string) {
    return prisma.serviceOrder.delete({ where: { id } });
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
