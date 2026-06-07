import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const apply = (connected: boolean | null, reachable: boolean | null) => {
      if (connected === false) {
        setIsOnline(false);
        return;
      }
      if (reachable === false) {
        setIsOnline(false);
        return;
      }
      setIsOnline(true);
    };

    NetInfo.fetch().then((state) => {
      apply(state.isConnected, state.isInternetReachable);
    });

    const unsub = NetInfo.addEventListener((state) => {
      apply(state.isConnected, state.isInternetReachable);
    });

    return unsub;
  }, []);

  return { isOnline };
}
