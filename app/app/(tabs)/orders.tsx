import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/src/services/api-service";
import type { ServiceOrder, ServiceOrderStatus } from "@/src/types/api";
import { priorityLabels, statusColors, statusLabels } from "@/src/utils/status";
import { colors, tablet } from "@/src/constants/theme";

const filters: { label: string; value?: ServiceOrderStatus }[] = [
  { label: "Todas" },
  { label: "Abertas", value: "OPEN" },
  { label: "Atribuídas", value: "ASSIGNED" },
  { label: "Em execução", value: "IN_PROGRESS" },
  { label: "Finalizadas", value: "DONE" },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ServiceOrderStatus | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.myOrders(filter);
      setOrders(data);
    } catch {
      setOrders([]);
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
      <View style={styles.filters}>
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && orders.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={[
            styles.list,
            orders.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Nenhuma OS neste filtro.</Text>
              <Text style={styles.emptyHint}>Puxe para atualizar a lista.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              variant="accent"
              onPress={() => router.push(`/order/${item.id}`)}
              style={styles.orderCard}
            >
              <View style={styles.row}>
                <View style={styles.codeWrap}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.code}>{item.code}</Text>
                </View>
                <Badge label={statusLabels[item.status]} color={statusColors[item.status]} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                <Text style={styles.meta}>
                  {item.customer?.fullName ?? "Cliente"} ·{" "}
                  {priorityLabels[item.priority] ?? item.priority}
                </Text>
              </View>
              {item.address?.street ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.address} numberOfLines={2}>
                    {[item.address.street, item.address.number, item.address.city]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              ) : null}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.primary,
  },
  chipText: { fontSize: tablet.fontSmall, color: colors.text, fontWeight: "600" },
  chipTextActive: { color: colors.primary, fontWeight: "800" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  orderCard: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  codeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  code: { fontSize: tablet.fontSmall, fontWeight: "800", color: colors.primary },
  title: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  meta: { flex: 1, fontSize: tablet.fontSmall, color: colors.textMuted },
  address: { flex: 1, fontSize: tablet.fontSmall, color: colors.textMuted, lineHeight: 20 },
  loader: { marginTop: 48 },
  emptyWrap: { alignItems: "center", paddingTop: 48 },
  empty: { textAlign: "center", color: colors.textMuted, fontSize: tablet.fontBody },
  emptyHint: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: tablet.fontSmall,
    marginTop: 8,
  },
  emptyList: { flexGrow: 1 },
});
