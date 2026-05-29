import { prisma } from "../../db.js";

export class PushTokenRepository {
  async upsert(userId: string, token: string, platform: string) {
    return prisma.devicePushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async remove(token: string, userId: string) {
    return prisma.devicePushToken.deleteMany({
      where: { token, userId },
    });
  }

  async findByUserIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return prisma.devicePushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true, userId: true, platform: true },
    });
  }

  async removeInvalidTokens(tokens: string[]) {
    if (tokens.length === 0) return;
    await prisma.devicePushToken.deleteMany({
      where: { token: { in: tokens } },
    });
  }
}
