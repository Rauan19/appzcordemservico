import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { api } from "@/src/services/api-service";
import type { Product, StockBalance } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

type Row = StockBalance & { product?: Product };

export default function StockScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balance, products] = await Promise.all([api.stockBalance(), api.listProducts()]);
      const map = new Map(products.map((p) => [p.id, p]));
      setRows(
        balance
          .map((b) => ({ ...b, product: map.get(b.productId) }))
          .sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? "")),
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen padded={false}>
      <Text style={styles.subtitle}>Saldo atual no almoxarifado</Text>

      {loading && rows.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.productId}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum produto com movimentação de estoque.</Text>
          }
          renderItem={({ item }) => {
            const low = item.balance <= 5;
            return (
              <Card variant="elevated" style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.product?.name ?? item.productId}</Text>
                    {item.product?.sku ? (
                      <Text style={styles.sku}>SKU: {item.product.sku}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.qtyBox, low && styles.qtyBoxLow]}>
                    <Text style={[styles.qty, low && styles.qtyLow]}>{item.balance}</Text>
                    <Text style={styles.unit}>{item.product?.unit ?? "un"}</Text>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: tablet.fontBody,
    color: colors.textMuted,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, paddingRight: 12 },
  name: { fontSize: tablet.fontSubtitle, fontWeight: "700", color: colors.text },
  sku: { fontSize: tablet.fontSmall, color: colors.textMuted, marginTop: 4 },
  qtyBox: {
    alignItems: "center",
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: tablet.radius,
    backgroundColor: colors.accentLight,
  },
  qtyBoxLow: { backgroundColor: "#FEF3C7" },
  qty: { fontSize: 26, fontWeight: "800", color: colors.primary },
  qtyLow: { color: colors.warning },
  unit: { fontSize: tablet.fontSmall, color: colors.textMuted, marginTop: 2 },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 48, fontSize: tablet.fontBody },
});
