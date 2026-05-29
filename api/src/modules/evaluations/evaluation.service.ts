import { BadRequestError, NotFoundError } from "../../http/http-errors.ts";
import { prisma } from "../../db.js";
import { EvaluationRepository } from "./evaluation.repository.ts";

export class EvaluationService {
  constructor(private readonly repo = new EvaluationRepository()) {}

  list(filters?: { rating?: number; technicianId?: string }) {
    return this.repo.list(filters);
  }

  getStats() {
    return this.repo.getStats();
  }

  listEvaluableOrders() {
    return this.repo.listEvaluableOrders();
  }

  async create(
    input: {
      serviceOrderId: string;
      technicianId?: string;
      rating: number;
      comment?: string;
    },
    createdById?: string,
  ) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: {
        evaluation: true,
        assignees: { select: { userId: true } },
      },
    });

    if (!order) throw new NotFoundError("OS não encontrada");
    if (order.status !== "DONE") {
      throw new BadRequestError("Só é possível avaliar OS finalizadas");
    }
    if (order.evaluation) {
      throw new BadRequestError("Esta OS já possui avaliação");
    }

    let technicianId = input.technicianId ?? order.assignedToId ?? undefined;

    if (technicianId) {
      const assigneeIds = order.assignees.map((a) => a.userId);
      const allowed =
        technicianId === order.assignedToId || assigneeIds.includes(technicianId);
      if (!allowed) {
        throw new BadRequestError("Técnico não está vinculado a esta OS");
      }

      const tech = await prisma.user.findFirst({
        where: { id: technicianId, role: "TECHNICIAN", active: true },
      });
      if (!tech) throw new BadRequestError("Técnico inválido ou inativo");
    }

    return this.repo.create({
      serviceOrderId: input.serviceOrderId,
      technicianId,
      rating: input.rating,
      comment: input.comment,
      createdById,
    });
  }
}
