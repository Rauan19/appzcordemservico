import { prisma } from "../../db.js";

type AddressInput = {
  label?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  complement?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
};

export class AddressRepository {
  async create(customerId: string, data: AddressInput) {
    return prisma.address.create({ data: { customerId, ...data } });
  }

  async listByCustomer(customerId: string) {
    return prisma.address.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, customerId: string) {
    return prisma.address.findFirst({ where: { id, customerId } });
  }

  async updateLocation(id: string, latitude: number, longitude: number) {
    return prisma.address.update({
      where: { id },
      data: { latitude, longitude },
    });
  }
}
