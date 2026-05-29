import { BadRequestError, ForbiddenError, NotFoundError } from "../../http/http-errors.ts";
import { prisma } from "../../db.js";
import { CustomerRatingRepository } from "./customer-rating.repository.ts";

async function assertTechnicianOnOrder(serviceOrderId: string, technicianId: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      customerRating: true,
      assignees: { select: { userId: true } },
    },
  });

  if (!order) throw new NotFoundError("OS não encontrada");

  const isAssigned =
    order.assignedToId === technicianId ||
    order.assignees.some((a) => a.userId === technicianId);

  if (!isAssigned) {
    throw new ForbiddenError("Esta OS não está atribuída a você");
  }

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

export class CustomerRatingService {
  constructor(private readonly repo = new CustomerRatingRepository()) {}

  listMine(technicianId: string) {
    return this.repo.listByTechnician(technicianId);
  }

  listRateableOrders(technicianId: string) {
    return this.repo.listRateableOrders(technicianId);
  }

  async create(
    technicianId: string,
    input: { serviceOrderId: string; rating: number; comment?: string },
  ) {
    await assertTechnicianOnOrder(input.serviceOrderId, technicianId);

    return this.repo.create({
      serviceOrderId: input.serviceOrderId,
      technicianId,
      rating: input.rating,
      comment: input.comment,
    });
  }
}
