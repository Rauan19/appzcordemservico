import { prisma } from "../../db.js";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });
  }

  async setActive(id: string, active: boolean) {
    return prisma.user.update({
      where: { id },
      data: { active },
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

  async countActiveByRole(role: string) {
    return prisma.user.count({
      where: { role: role as never, active: true },
    });
  }

  async list(filters?: { role?: string; active?: boolean }) {
    return prisma.user.findMany({
      where: {
        ...(filters?.role ? { role: filters.role as never } : {}),
        ...(filters?.active !== undefined ? { active: filters.active } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }
}
