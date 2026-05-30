import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StockFilterBar, type StockFilter } from "@/components/stock/StockFilterBar";
import { StockListCard } from "@/components/stock/StockListCard";
import { Screen } from "@/components/ui/Screen";
import { api } from "@/src/services/api-service";
import { showErrorAlert } from "@/src/lib/errors";
import type { Product } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

type StockRow = {
  product: Product;
  balance: number;
};

function mergeStockRows(products: Product[], balances: Record<string, number>): StockRow[] {
  return products
    .filter((p) => p.active)
    .map((product) => ({
      product,
      balance: balances[product.id] ?? 0,
    }))
    .sort((a, b) => a.product.name.localeCompare(b.product.name, "pt-BR"));
}

export default function StockScreen() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balance, products] = await Promise.all([api.stockBalance(), api.listProducts()]);
      const balances = Object.fromEntries(balance.map((b) => [b.productId, b.balance]));
      setRows(mergeStockRows(products, balances));
    } catch (err) {
      setRows([]);
      showErrorAlert(err, "loadStock");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lowCount = useMemo(
    () => rows.filter((r) => r.balance > 0 && r.balance <= 5).length,
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.product.name.toLowerCase().includes(q) ||
        (row.product.sku?.toLowerCase().includes(q) ?? false);

      if (!matchesSearch) return false;

      if (filter === "available") return row.balance > 0;
      if (filter === "low") return row.balance > 0 && row.balance <= 5;
      if (filter === "empty") return row.balance <= 0;
      return true;
    });
  }, [rows, filter, search]);

  return (
    <Screen padded={false}>
      <StockFilterBar
        filter={filter}
        count={filteredRows.length}
        total={rows.length}
        lowCount={lowCount}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onChange={setFilter}
      />

      <Text style={styles.hint}>
        Consulte o saldo antes de lançar materiais na OS. Itens zerados não podem ser utilizados.
      </Text>

      {loading && rows.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.product.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
          }
          contentContainerStyle={[styles.list, filteredRows.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {search.trim()
                  ? "Nenhum produto encontrado"
                  : filter === "empty"
                    ? "Nenhum produto zerado"
                    : filter === "low"
                      ? "Nenhum produto com saldo baixo"
                      : filter === "available"
                        ? "Nenhum produto com saldo disponível"
                        : "Nenhum produto cadastrado"}
              </Text>
              <Text style={styles.emptyHint}>
                {search.trim()
                  ? "Tente outro termo de busca ou limpe o filtro."
                  : "Puxe a lista para atualizar ou peça ao almoxarifado cadastrar produtos."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <StockListCard product={item.product} balance={item.balance} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    lineHeight: 20,
  },
  list: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8 },
  loader: { marginTop: 32 },
  emptyList: { flexGrow: 1 },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
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
});
