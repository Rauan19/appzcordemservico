import { BadRequestError, NotFoundError } from "../../http/http-errors.ts";
import { prisma } from "../../db.js";
import { CustomerRatingRepository } from "./customer-rating.repository.ts";

async function loadOrderForRating(serviceOrderId: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      customerRating: true,
      assignees: { select: { userId: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) throw new NotFoundError("OS não encontrada");

  if (!["IN_PROGRESS", "DONE"].includes(order.status)) {
    throw new BadRequestError(
      "Só é possível registrar avaliação em OS em execução ou finalizadas",
    );
  }

  if (order.customerRating) {
    throw new BadRequestError("Esta OS já possui avaliação do cliente");
  }

  return order;
}

function resolveRatedTechnicianId(
  order: { assignedToId: string | null; assignees: { userId: string }[] },
  recordedById: string,
) {
  return order.assignedToId ?? order.assignees[0]?.userId ?? recordedById;
}

export class CustomerRatingService {
  constructor(private readonly repo = new CustomerRatingRepository()) {}

  listMine(technicianId: string) {
    return this.repo.listByTechnician(technicianId);
  }

  listRateableOrders(_technicianId: string) {
    return this.repo.listRateableOrders();
  }

  async create(
    technicianId: string,
    input: { serviceOrderId: string; rating: number; comment?: string },
  ) {
    const order = await loadOrderForRating(input.serviceOrderId);
    const ratedTechnicianId = resolveRatedTechnicianId(order, technicianId);

    return this.repo.create({
      serviceOrderId: input.serviceOrderId,
      technicianId: ratedTechnicianId,
      rating: input.rating,
      comment: input.comment,
    });
  }
}
