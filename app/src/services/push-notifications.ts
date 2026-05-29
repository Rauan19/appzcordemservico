import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "@/src/lib/api";

export const FCM_CHANNEL_ID = "os_alerts";
const PUSH_TOKEN_KEY = "push_device_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupPushNotificationsChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(FCM_CHANNEL_ID, {
      name: "Ordens de serviço",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 150, 400],
      lightColor: "#0B2D6B",
      sound: "default",
      enableVibrate: true,
    });
  }
}

export async function registerPushNotifications() {
  if (!Device.isDevice) {
    console.warn("[push] Push só funciona em dispositivo físico.");
    return null;
  }

  await setupPushNotificationsChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    console.warn("[push] Permissão de notificação negada.");
    return null;
  }

  const devicePush = await Notifications.getDevicePushTokenAsync();
  const fcmToken = devicePush.data;
  const platform = Platform.OS === "ios" ? "ios" : "android";

  await apiRequest("/push/device-token", {
    method: "POST",
    body: { token: fcmToken, platform },
  });

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, fcmToken);
  return fcmToken;
}

export async function unregisterPushNotifications() {
  const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (stored) {
    try {
      await apiRequest("/push/device-token", {
        method: "DELETE",
        body: { token: stored },
      });
    } catch {
      // ignore logout cleanup errors
    }
  }
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export function addNotificationResponseListener(
  handler: (orderId: string) => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const orderId = typeof data?.orderId === "string" ? data.orderId : null;
    if (orderId) handler(orderId);
  });
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}
