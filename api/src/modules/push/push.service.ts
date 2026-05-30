import { BadRequestError } from "../../http/http-errors.ts";
import { FCM_CHANNEL_ID, getFirebaseMessaging, isFirebaseConfigured } from "../../infra/firebase.ts";
import { PushTokenRepository } from "./push.repository.ts";

const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export class PushNotificationService {
  constructor(private readonly tokens = new PushTokenRepository()) {}

  registerToken(userId: string, token: string, platform: string) {
    return this.tokens.upsert(userId, token, platform);
  }

  unregisterToken(userId: string, token: string) {
    return this.tokens.remove(token, userId);
  }

  async notifyNewServiceOrder(input: {
    orderId: string;
    code: string;
    title: string;
    priority: string;
    customerName?: string;
    technicianIds: string[];
  }) {
    if (!isFirebaseConfigured() || input.technicianIds.length === 0) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const rows = await this.tokens.findByUserIds(input.technicianIds);
    const fcmTokens = rows.map((r) => r.token);
    if (fcmTokens.length === 0) return;

    const priorityLabel = priorityLabels[input.priority] ?? input.priority;
    const body = [
      input.code,
      input.title,
      input.customerName ? `Cliente: ${input.customerName}` : null,
      `Prioridade: ${priorityLabel}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const invalid: string[] = [];

    for (const chunk of chunkArray(fcmTokens, 500)) {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: "Nova ordem de serviço",
          body,
        },
        data: {
          type: "NEW_SERVICE_ORDER",
          orderId: input.orderId,
          code: input.code,
        },
        android: {
          priority: "high",
          notification: {
            channelId: FCM_CHANNEL_ID,
            sound: "default",
            defaultVibrateTimings: true,
            priority: "max",
            visibility: "public",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      });

      response.responses.forEach((res, index) => {
        if (res.success) return;
        const code = res.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalid.push(chunk[index]!);
        }
      });
    }

    if (invalid.length > 0) {
      await this.tokens.removeInvalidTokens(invalid);
    }
  }

  async getAdminOverview() {
    const rows = await this.tokens.listAllWithUser();
    const byPlatform: Record<string, number> = {};
    const technicianIds = new Set<string>();

    for (const row of rows) {
      byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + 1;
      if (row.user.role === "TECHNICIAN" && row.user.active) {
        technicianIds.add(row.userId);
      }
    }

    return {
      firebaseConfigured: isFirebaseConfigured(),
      stats: {
        totalDevices: rows.length,
        connectedTechnicians: technicianIds.size,
        byPlatform,
      },
      devices: rows.map((row) => ({
        id: row.id,
        tokenPreview: maskToken(row.token),
        platform: row.platform,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        user: row.user,
      })),
    };
  }

  async sendManualPush(input: {
    title: string;
    body: string;
    technicianIds?: string[];
    orderId?: string;
  }) {
    if (!isFirebaseConfigured()) {
      throw new BadRequestError(
        "Firebase não configurado na API. Verifique firebase-service-account.json ou variáveis FIREBASE_*.",
      );
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      throw new BadRequestError("Não foi possível inicializar o Firebase Messaging.");
    }

    const rows = await this.tokens.findForPush(input.technicianIds);
    const fcmTokens = rows.map((r) => r.token);

    if (fcmTokens.length === 0) {
      throw new BadRequestError(
        "Nenhum dispositivo conectado para os técnicos selecionados. Peça para abrirem o app no tablet.",
      );
    }

    let sent = 0;
    let failed = 0;
    const invalid: string[] = [];

    const data: Record<string, string> = {
      type: input.orderId ? "MANUAL_ORDER" : "MANUAL",
    };
    if (input.orderId) data.orderId = input.orderId;

    for (const chunk of chunkArray(fcmTokens, 500)) {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: input.title,
          body: input.body,
        },
        data,
        android: {
          priority: "high",
          notification: {
            channelId: FCM_CHANNEL_ID,
            sound: "default",
            defaultVibrateTimings: true,
            priority: "max",
            visibility: "public",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      });

      response.responses.forEach((res, index) => {
        if (res.success) {
          sent += 1;
          return;
        }
        failed += 1;
        const code = res.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalid.push(chunk[index]!);
        }
      });
    }

    if (invalid.length > 0) {
      await this.tokens.removeInvalidTokens(invalid);
    }

    return {
      targetedDevices: fcmTokens.length,
      sent,
      failed,
      invalidTokensRemoved: invalid.length,
    };
  }
}

function maskToken(token: string) {
  if (token.length <= 16) return `${token.slice(0, 4)}…`;
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const pushNotificationService = new PushNotificationService();
