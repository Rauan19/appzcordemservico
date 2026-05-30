import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { OrderFilterBar } from "@/components/order/OrderFilterBar";
import { OrderListCard } from "@/components/order/OrderListCard";
import { Screen } from "@/components/ui/Screen";
import { api } from "@/src/services/api-service";
import { showErrorAlert } from "@/src/lib/errors";
import type { ServiceOrder, ServiceOrderStatus } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ServiceOrderStatus | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listOrders(filter);
      setOrders(data);
    } catch (err) {
      setOrders([]);
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

  return (
    <Screen padded={false}>
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
              <Text style={styles.empty}>Nenhuma ordem neste filtro</Text>
              <Text style={styles.emptyHint}>Puxe para atualizar ou altere o filtro acima.</Text>
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
