import { prisma } from "../../db.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../http/http-errors.ts";
import { CustomerRepository } from "../customers/customer.repository.ts";
import { AddressRepository } from "../addresses/address.repository.ts";
import { ProductRepository } from "../products/product.repository.ts";
import { StockRepository } from "../stock/stock.repository.ts";
import { pushNotificationService } from "../push/push.service.ts";
import { ServiceOrderRepository, type ListServiceOrderFilters } from "./service-order.repository.ts";

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

function toDecimalString(n: number) {
  return n.toFixed(3);
}

function generateCode() {
  // Simples e único o suficiente pro MVP (pode virar sequência depois)
  const ts = Date.now().toString(36).toUpperCase();
  return `OS-${ts}`;
}

function parseScheduledAt(value?: string) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  return new Date(value);
}

export class ServiceOrderService {
  constructor(
    private readonly repo = new ServiceOrderRepository(),
    private readonly customers = new CustomerRepository(),
    private readonly addresses = new AddressRepository(),
    private readonly products = new ProductRepository(),
    private readonly stock = new StockRepository(),
  ) {}

  async create(input: {
    customerId: string;
    addressId?: string;
    assignedToId?: string;
    assignedToIds?: string[];
    title: string;
    description?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    scheduledAt?: string;
    customerPppoeUser?: string;
    customerPppoePassword?: string;
    customerWifiName?: string;
    customerWifiPassword?: string;
  }) {
    const customer = await this.customers.findById(input.customerId);
    if (!customer) throw new NotFoundError("Cliente não encontrado");

    const assignedToIds = uniqueIds([
      ...(input.assignedToIds ?? []),
      ...(input.assignedToId ? [input.assignedToId] : []),
    ]);

    if (assignedToIds.length > 0) {
      const technicians = await prisma.user.findMany({
        where: {
          id: { in: assignedToIds },
          role: "TECHNICIAN",
          active: true,
        },
        select: { id: true },
      });
      if (technicians.length !== assignedToIds.length) {
        throw new BadRequestError("Um ou mais técnicos são inválidos ou inativos");
      }
    }

    const order = await this.repo.create({
      code: generateCode(),
      customerId: input.customerId,
      addressId: input.addressId,
      assignedToId: assignedToIds[0],
      assignedToIds,
      status: "OPEN",
      title: input.title,
      description: input.description,
      priority: input.priority,
      scheduledAt: parseScheduledAt(input.scheduledAt),
      customerPppoeUser: input.customerPppoeUser,
      customerPppoePassword: input.customerPppoePassword,
      customerWifiName: input.customerWifiName,
      customerWifiPassword: input.customerWifiPassword,
    });

    void pushNotificationService
      .notifyNewServiceOrder({
        orderId: order.id,
        code: order.code,
        title: order.title,
        priority: order.priority,
        customerName: order.customer?.fullName,
        technicianIds: assignedToIds,
      })
      .catch((err) => {
        console.error("[push] Falha ao notificar técnicos:", err);
      });

    return order;
  }

  async list(filters?: ListServiceOrderFilters) {
    return this.repo.list(filters);
  }

  async getCreatedStats() {
    return this.repo.countCreatedStats();
  }

  async getById(id: string) {
    const so = await this.repo.findById(id);
    if (!so) throw new NotFoundError("OS não encontrada");
    return so;
  }

  async updateStatus(id: string, status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELED") {
    const so = await this.getById(id);

    const allowed: Record<string, string[]> = {
      OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELED"],
      ASSIGNED: ["IN_PROGRESS", "CANCELED"],
      IN_PROGRESS: ["DONE", "CANCELED"],
      DONE: [],
      CANCELED: [],
    };

    if (!allowed[so.status]?.includes(status)) {
      throw new BadRequestError(
        `Não é possível mudar de ${so.status} para ${status}`,
      );
    }

    return this.repo.updateStatus(id, status);
  }

  async updateTechnicianReport(
    id: string,
    userRole: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN",
    technicianReport?: string | null,
  ) {
    const so = await this.getById(id);

    if (so.status === "CANCELED") {
      throw new BadRequestError("OS cancelada não aceita relatório");
    }

    if (userRole !== "TECHNICIAN" && userRole !== "ADMIN" && userRole !== "MANAGER") {
      throw new ForbiddenError();
    }

    const value = technicianReport?.trim() ? technicianReport.trim() : null;
    return this.repo.updateTechnicianReport(id, value);
  }

  async updateAddressLocation(
    id: string,
    userRole: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN",
    latitude: number,
    longitude: number,
  ) {
    if (userRole !== "TECHNICIAN" && userRole !== "ADMIN" && userRole !== "MANAGER") {
      throw new ForbiddenError();
    }

    const so = await this.getById(id);

    if (so.status === "CANCELED") {
      throw new BadRequestError("OS cancelada não aceita atualização de localização");
    }

    if (!so.addressId) {
      throw new BadRequestError("OS sem endereço vinculado");
    }

    await this.addresses.updateLocation(so.addressId, latitude, longitude);
    return this.getById(id);
  }

  async update(
    id: string,
    userRole: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN",
    input: {
      customerId?: string;
      addressId?: string | null;
      assignedToIds?: string[];
      title?: string;
      description?: string | null;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      status?: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
      scheduledAt?: string | null;
      customerPppoeUser?: string | null;
      customerPppoePassword?: string | null;
      customerWifiName?: string | null;
      customerWifiPassword?: string | null;
      technicianReport?: string | null;
    },
  ) {
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      throw new ForbiddenError("Somente admin pode editar a OS");
    }

    await this.getById(id);

    if (input.customerId) {
      const customer = await this.customers.findById(input.customerId);
      if (!customer) throw new NotFoundError("Cliente não encontrado");
    }

    let assignedToIds: string[] | undefined;
    if (input.assignedToIds !== undefined) {
      assignedToIds = uniqueIds(input.assignedToIds);
      if (assignedToIds.length > 0) {
        const technicians = await prisma.user.findMany({
          where: {
            id: { in: assignedToIds },
            role: "TECHNICIAN",
            active: true,
          },
          select: { id: true },
        });
        if (technicians.length !== assignedToIds.length) {
          throw new BadRequestError("Um ou mais técnicos são inválidos ou inativos");
        }
      }
    }

    let scheduledAt: Date | null | undefined;
    if (input.scheduledAt === null) {
      scheduledAt = null;
    } else if (input.scheduledAt !== undefined) {
      scheduledAt = parseScheduledAt(input.scheduledAt);
    }

    const description =
      input.description === undefined
        ? undefined
        : input.description?.trim()
          ? input.description.trim()
          : null;

    const technicianReport =
      input.technicianReport === undefined
        ? undefined
        : input.technicianReport?.trim()
          ? input.technicianReport.trim()
          : null;

    const customerPppoeUser =
      input.customerPppoeUser === undefined
        ? undefined
        : input.customerPppoeUser?.trim()
          ? input.customerPppoeUser.trim()
          : null;

    const customerPppoePassword =
      input.customerPppoePassword === undefined
        ? undefined
        : input.customerPppoePassword?.trim()
          ? input.customerPppoePassword.trim()
          : null;

    const customerWifiName =
      input.customerWifiName === undefined
        ? undefined
        : input.customerWifiName?.trim()
          ? input.customerWifiName.trim()
          : null;

    const customerWifiPassword =
      input.customerWifiPassword === undefined
        ? undefined
        : input.customerWifiPassword?.trim()
          ? input.customerWifiPassword.trim()
          : null;

    return this.repo.updateFull(id, {
      customerId: input.customerId,
      addressId: input.addressId,
      assignedToIds,
      title: input.title,
      description,
      priority: input.priority,
      status: input.status,
      scheduledAt,
      customerPppoeUser,
      customerPppoePassword,
      customerWifiName,
      customerWifiPassword,
      technicianReport,
    });
  }

  async delete(id: string, userRole: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN") {
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      throw new ForbiddenError("Somente admin pode excluir a OS");
    }

    await this.getById(id);
    await this.repo.deleteById(id);
    return { ok: true as const, deleted: true as const };
  }

  async addItem(
    serviceOrderId: string,
    input: {
      productId: string;
      quantity: number;
      description?: string;
      reason?: string;
      userId?: string;
    },
  ) {
    const so = await this.getById(serviceOrderId);
    if (so.status === "DONE" || so.status === "CANCELED") {
      throw new BadRequestError("OS finalizada ou cancelada não aceita itens");
    }

    const product = await this.products.findById(input.productId);
    if (!product || !product.active) throw new NotFoundError("Produto não encontrado");

    const balance = await this.stock.balanceForProduct(input.productId);
    if (balance < input.quantity) {
      throw new BadRequestError(
        `Estoque insuficiente. Disponível: ${balance}, solicitado: ${input.quantity}`,
      );
    }

    return this.repo.addItemWithStockOut({
      serviceOrderId,
      productId: input.productId,
      quantity: toDecimalString(input.quantity),
      description: input.description,
      reason: input.reason,
      userId: input.userId,
    });
  }

  async addItems(
    serviceOrderId: string,
    items: Array<{
      productId: string;
      quantity: number;
      description?: string;
    }>,
    options?: { reason?: string; userId?: string },
  ) {
    const so = await this.getById(serviceOrderId);
    if (so.status === "DONE" || so.status === "CANCELED") {
      throw new BadRequestError("OS finalizada ou cancelada não aceita itens");
    }

    if (items.length === 0) {
      throw new BadRequestError("Selecione ao menos um produto");
    }

    const qtyByProduct = new Map<string, number>();
    const productNames = new Map<string, string>();

    for (const item of items) {
      const product = await this.products.findById(item.productId);
      if (!product || !product.active) {
        throw new NotFoundError(`Produto não encontrado: ${item.productId}`);
      }
      productNames.set(product.id, product.name);
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    for (const [productId, totalQty] of qtyByProduct) {
      const balance = await this.stock.balanceForProduct(productId);
      if (balance < totalQty) {
        const name = productNames.get(productId) ?? "Produto";
        throw new BadRequestError(
          `Estoque insuficiente para ${name}. Disponível: ${balance}, solicitado: ${totalQty}`,
        );
      }
    }

    return this.repo.addItemsWithStockOutBatch({
      serviceOrderId,
      userId: options?.userId,
      reason: options?.reason,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: toDecimalString(item.quantity),
        description: item.description,
      })),
    });
  }

  async registerDefect(
    serviceOrderId: string,
    input: {
      productId: string;
      quantity: number;
      reason: string;
      note?: string;
      userId?: string;
    },
  ) {
    await this.getById(serviceOrderId);

    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError("Produto não encontrado");

    return this.repo.registerDefectMovement({
      serviceOrderId,
      productId: input.productId,
      quantity: toDecimalString(input.quantity),
      reason: input.reason,
      note: input.note,
      userId: input.userId,
    });
  }
}

