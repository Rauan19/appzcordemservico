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
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const pushNotificationService = new PushNotificationService();
