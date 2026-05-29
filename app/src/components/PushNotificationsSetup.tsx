import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerPushNotifications,
} from "@/src/services/push-notifications";

export function PushNotificationsSetup() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "TECHNICIAN") return;

    registerPushNotifications().catch((err) => {
      console.warn("[push] Falha ao registrar token:", err);
    });
  }, [user?.id, user?.role]);

  useEffect(() => {
    const responseSub = addNotificationResponseListener((orderId) => {
      router.push(`/order/${orderId}`);
    });

    const receivedSub = addNotificationReceivedListener(() => {
      // Som/vibração em foreground já tratados pelo handler e canal Android.
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [router]);

  return null;
}
