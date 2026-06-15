import { prisma } from "../../db.js";

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLatitude: true,
        lastLongitude: true,
        lastLocationAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLatitude: true,
        lastLongitude: true,
        lastLocationAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN";
  }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }
}
