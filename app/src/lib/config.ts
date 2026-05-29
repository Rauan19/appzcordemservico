import { Platform } from "react-native";

/**
 * URL da API. No tablet físico use o IP da máquina (ex.: http://192.168.0.10:3333).
 * Emulador Android: http://10.0.2.2:3333
 */
const envUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL =
  envUrl ??
  (Platform.OS === "android" ? "http://10.0.2.2:3333" : "http://127.0.0.1:3333");
