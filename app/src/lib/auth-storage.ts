import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/src/types/api";

const TOKEN_KEY = "@zcnet:token";
const USER_KEY = "@zcnet:user";

export async function saveSession(token: string, user: User) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function loadSession(): Promise<{ token: string; user: User } | null> {
  const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token || !userJson) return null;
  return { token, user: JSON.parse(userJson) as User };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
