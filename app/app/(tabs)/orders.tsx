import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { OrderFilterBar } from "@/components/order/OrderFilterBar";
import { OrderListCard } from "@/components/order/OrderListCard";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Screen } from "@/components/ui/Screen";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { showErrorAlert } from "@/src/lib/errors";
import { loadOrdersList } from "@/src/services/orders-offline";
import type { ServiceOrderListFilter } from "@/src/services/api-service";
import type { ServiceOrder } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

export default function OrdersScreen() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ServiceOrderListFilter>("all");
  const [fromCache, setFromCache] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadOrdersList(filter);
      setOrders(result.orders);
      setFromCache(result.fromCache);
      setSyncedAt(result.syncedAt);
    } catch (err) {
      setOrders([]);
      setFromCache(false);
      setSyncedAt(undefined);
      showErrorAlert(err, "loadOrders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const showOfflineBanner = fromCache || !isOnline;

  return (
    <Screen padded={false}>
      {showOfflineBanner ? <OfflineBanner syncedAt={syncedAt} /> : null}

      <OrderFilterBar
        filter={filter}
        count={orders.length}
        loading={loading}
        onChange={setFilter}
      />

      {loading && orders.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          style={styles.listFlex}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
          }
          contentContainerStyle={[styles.list, orders.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>OS</Text>
              </View>
              <Text style={styles.empty}>
                {showOfflineBanner
                  ? "Nenhuma OS salva neste filtro"
                  : "Nenhuma ordem neste filtro"}
              </Text>
              <Text style={styles.emptyHint}>
                {showOfflineBanner
                  ? "Conecte-se à internet e puxe a lista para atualizar o cache."
                  : "Puxe para atualizar ou altere o filtro acima."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderListCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 4 },
  loader: { marginTop: 32 },
  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  empty: {
    textAlign: "center",
    color: colors.text,
    fontSize: tablet.fontBody,
    fontWeight: "700",
  },
  emptyHint: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: tablet.fontSmall,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyList: { flexGrow: 1 },
});
