import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

let initialized = false;

function loadServiceAccount():
  | admin.ServiceAccount
  | null {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (path) {
    try {
      const raw = readFileSync(resolve(path), "utf8");
      return JSON.parse(raw) as admin.ServiceAccount;
    } catch (err) {
      console.error("[firebase] Não foi possível ler FIREBASE_SERVICE_ACCOUNT_PATH:", err);
      return null;
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

export function isFirebaseConfigured() {
  return loadServiceAccount() !== null;
}

export function getFirebaseMessaging() {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) return null;

  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  }

  return admin.messaging();
}

export const FCM_CHANNEL_ID = "os_alerts";
