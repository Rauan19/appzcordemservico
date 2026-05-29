import { prisma } from "../../db.js";

const evaluationInclude = {
  serviceOrder: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      customer: { select: { id: true, fullName: true } },
      assignees: {
        include: { user: { select: { id: true, name: true } } },
      },
      assignedTo: { select: { id: true, name: true } },
    },
  },
  technician: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
};

export class EvaluationRepository {
  async list(filters?: { rating?: number; technicianId?: string }) {
    return prisma.serviceOrderEvaluation.findMany({
      where: {
        ...(filters?.rating ? { rating: filters.rating } : {}),
        ...(filters?.technicianId ? { technicianId: filters.technicianId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: evaluationInclude,
    });
  }

  async findByServiceOrderId(serviceOrderId: string) {
    return prisma.serviceOrderEvaluation.findUnique({
      where: { serviceOrderId },
    });
  }

  async create(data: {
    serviceOrderId: string;
    technicianId?: string;
    rating: number;
    comment?: string;
    createdById?: string;
  }) {
    return prisma.serviceOrderEvaluation.create({
      data,
      include: evaluationInclude,
    });
  }

  async listEvaluableOrders() {
    return prisma.serviceOrder.findMany({
      where: {
        status: "DONE",
        evaluation: null,
      },
      orderBy: { finishedAt: "desc" },
      select: {
        id: true,
        code: true,
        title: true,
        finishedAt: true,
        customer: { select: { fullName: true } },
        assignedTo: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      take: 100,
    });
  }

  async getStats() {
    const [aggregate, byTechnician] = await Promise.all([
      prisma.serviceOrderEvaluation.aggregate({
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.serviceOrderEvaluation.groupBy({
        by: ["technicianId"],
        _avg: { rating: true },
        _count: { id: true },
        where: { technicianId: { not: null } },
      }),
    ]);

    const techIds = byTechnician
      .map((r) => r.technicianId)
      .filter((id): id is string => Boolean(id));

    const technicians = techIds.length
      ? await prisma.user.findMany({
          where: { id: { in: techIds } },
          select: { id: true, name: true },
        })
      : [];

    const techMap = new Map(technicians.map((t) => [t.id, t.name]));

    return {
      total: aggregate._count.id,
      averageRating: aggregate._avg.rating ?? 0,
      byTechnician: byTechnician.map((row) => ({
        technicianId: row.technicianId!,
        technicianName: techMap.get(row.technicianId!) ?? "",
        averageRating: row._avg.rating ?? 0,
        count: row._count.id,
      })),
    };
  }
}
