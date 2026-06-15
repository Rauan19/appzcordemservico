import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

export function parseCoord(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function formatCoord(value: string | number | null | undefined): string {
  const n = parseCoord(value);
  if (n == null) return "Não registrada";
  return n.toFixed(6);
}

export async function getCurrentCoords(): Promise<{ latitude: number; longitude: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permissão de localização negada. Ative nas configurações do aparelho.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export async function openRouteInMaps(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<void> {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;

  const googleMapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(originStr)}` +
    `&destination=${encodeURIComponent(destStr)}` +
    `&travelmode=driving`;

  const wazeUrl =
    `https://waze.com/ul?ll=${encodeURIComponent(destStr)}` +
    `&navigate=yes`;

  if (Platform.OS === "ios") {
    const appleMapsUrl =
      `http://maps.apple.com/?saddr=${encodeURIComponent(originStr)}` +
      `&daddr=${encodeURIComponent(destStr)}&dirflg=d`;

    Alert.alert("Abrir rota", "Escolha o app de mapas:", [
      { text: "Google Maps", onPress: () => Linking.openURL(googleMapsUrl) },
      { text: "Apple Maps", onPress: () => Linking.openURL(appleMapsUrl) },
      { text: "Waze", onPress: () => Linking.openURL(wazeUrl) },
      { text: "Cancelar", style: "cancel" },
    ]);
    return;
  }

  Alert.alert("Abrir rota", "Escolha o app de mapas:", [
    { text: "Google Maps", onPress: () => Linking.openURL(googleMapsUrl) },
    { text: "Waze", onPress: () => Linking.openURL(wazeUrl) },
    { text: "Cancelar", style: "cancel" },
  ]);
}
