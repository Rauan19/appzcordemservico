import { prisma } from "../../db.js";

export class CustomerRepository {
  async create(data: {
    fullName: string;
    cpf: string;
    phone: string;
    email?: string;
  }) {
    return prisma.customer.create({ data });
  }

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: { addresses: true },
    });
  }

  async findByCpf(cpf: string) {
    return prisma.customer.findUnique({ where: { cpf } });
  }

  async list() {
    return prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

