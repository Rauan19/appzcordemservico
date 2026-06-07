import NetInfo from "@react-native-community/netinfo";

export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function isFetchFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TypeError" &&
    (msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed") ||
      msg.includes("internet") ||
      msg.includes("timeout") ||
      msg.includes("aborted"))
  );
}
