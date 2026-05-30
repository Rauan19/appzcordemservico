import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/src/types/api";

const TOKEN_KEY = "@zcnet:token";
const USER_KEY = "@zcnet:user";
const EXPIRES_AT_KEY = "@zcnet:expires_at";

/** Mesmo prazo do JWT na API (365 dias). */
export const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export async function saveSession(token: string, user: User) {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
    [EXPIRES_AT_KEY, expiresAt],
  ]);
}

export async function loadSession(): Promise<{ token: string; user: User } | null> {
  const [[, token], [, userJson], [, expiresAtRaw]] = await AsyncStorage.multiGet([
    TOKEN_KEY,
    USER_KEY,
    EXPIRES_AT_KEY,
  ]);

  if (!token || !userJson) return null;

  if (!expiresAtRaw) {
    await AsyncStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + SESSION_TTL_MS));
    return { token, user: JSON.parse(userJson) as User };
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    await clearSession();
    return null;
  }

  return { token, user: JSON.parse(userJson) as User };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, EXPIRES_AT_KEY]);
}

export async function getToken() {
  const session = await loadSession();
  return session?.token ?? null;
}
