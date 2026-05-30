import { prisma } from "../../db.js";

const ratingInclude = {
  serviceOrder: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      customer: { select: { id: true, fullName: true } },
    },
  },
  technician: { select: { id: true, name: true } },
};

export class CustomerRatingRepository {
  async listByTechnician(technicianId: string) {
    return prisma.serviceOrderCustomerRating.findMany({
      where: { technicianId },
      orderBy: { createdAt: "desc" },
      include: ratingInclude,
    });
  }

  async findByServiceOrderId(serviceOrderId: string) {
    return prisma.serviceOrderCustomerRating.findUnique({
      where: { serviceOrderId },
    });
  }

  async create(data: {
    serviceOrderId: string;
    technicianId: string;
    rating: number;
    comment?: string;
  }) {
    return prisma.serviceOrderCustomerRating.create({
      data,
      include: ratingInclude,
    });
  }

  async listRateableOrders() {
    return prisma.serviceOrder.findMany({
      where: {
        customerRating: null,
        status: { in: ["IN_PROGRESS", "DONE"] },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        customer: { select: { fullName: true, phone: true } },
      },
      take: 100,
    });
  }
}
