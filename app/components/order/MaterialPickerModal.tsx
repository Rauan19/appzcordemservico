import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

export type MaterialSelection = {
  productId: string;
  quantity: number;
};

type Props = {
  visible: boolean;
  mode: "item" | "defect";
  products: Product[];
  stockByProduct: Record<string, number>;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (items: MaterialSelection[], reason: string) => void;
};

export function MaterialPickerModal({
  visible,
  mode,
  products,
  stockByProduct,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState(mode === "defect" ? "" : "Uso na OS");
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setSearch("");
    setSelected({});
    setReason(mode === "defect" ? "" : "Uso na OS");
  }, [visible, mode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false),
    );
  }, [products, search]);

  const selectedCount = Object.keys(selected).length;

  function toggleProduct(product: Product) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = "1";
      }
      return next;
    });
  }

  function setQuantity(productId: string, value: string) {
    setSelected((prev) => ({ ...prev, [productId]: value }));
  }

  function handleConfirm() {
    const items: MaterialSelection[] = [];
    for (const [productId, qtyStr] of Object.entries(selected)) {
      const qty = Number(qtyStr.replace(",", "."));
      if (qty > 0) items.push({ productId, quantity: qty });
    }
    onConfirm(items, reason);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <Text style={styles.title}>
          {mode === "item" ? "Produtos utilizados" : "Produtos com defeito"}
        </Text>
        <Text style={styles.subtitle}>
          Selecione um ou mais produtos e informe a quantidade de cada um.
        </Text>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou SKU..."
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.counter}>
          {selectedCount === 0
            ? "Nenhum produto selecionado"
            : `${selectedCount} produto(s) selecionado(s)`}
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum produto encontrado.</Text>
          }
          renderItem={({ item }) => {
            const isSelected = Boolean(selected[item.id]);
            const stock = stockByProduct[item.id];
            const stockLabel =
              stock !== undefined ? `Estoque: ${stock} ${item.unit}` : null;

            return (
              <Pressable
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggleProduct(item)}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.sku ? <Text style={styles.meta}>SKU: {item.sku}</Text> : null}
                  {stockLabel ? <Text style={styles.meta}>{stockLabel}</Text> : null}
                  {isSelected && (
                    <View style={styles.qtyRow} onStartShouldSetResponder={() => true}>
                      <Text style={styles.qtyLabel}>Quantidade:</Text>
                      <TextInput
                        style={styles.qtyInput}
                        value={selected[item.id]}
                        onChangeText={(v) => setQuantity(item.id, v)}
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.unit}>{item.unit}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />

        <Text style={styles.label}>
          {mode === "defect" ? "Motivo do defeito (obrigatório)" : "Observação"}
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={2}
        />

        <Button
          title={
            selectedCount > 0
              ? `Confirmar ${selectedCount} produto(s)`
              : "Selecione os produtos"
          }
          onPress={handleConfirm}
          loading={loading}
          disabled={selectedCount === 0}
        />
        <Button title="Cancelar" variant="ghost" onPress={onClose} style={styles.cancel} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, padding: tablet.padding, backgroundColor: colors.background },
  title: { fontSize: tablet.fontTitle, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 12,
  },
  search: {
    minHeight: tablet.touchMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tablet.radius,
    paddingHorizontal: 16,
    fontSize: tablet.fontBody,
    backgroundColor: colors.surface,
    color: colors.text,
    marginBottom: 8,
  },
  counter: {
    fontSize: tablet.fontSmall,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  list: { flex: 1, marginBottom: 8 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginBottom: 8,
    borderRadius: tablet.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.accentLight },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: "#fff", fontWeight: "800", fontSize: 16 },
  rowBody: { flex: 1 },
  productName: { fontSize: tablet.fontBody, fontWeight: "600", color: colors.text },
  meta: { fontSize: tablet.fontSmall, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  qtyLabel: { fontSize: tablet.fontSmall, color: colors.text },
  qtyInput: {
    minWidth: 72,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tablet.fontBody,
    backgroundColor: colors.background,
    color: colors.text,
    textAlign: "center",
  },
  unit: { fontSize: tablet.fontSmall, color: colors.textMuted },
  label: { fontSize: tablet.fontSmall, fontWeight: "600", color: colors.text, marginBottom: 8 },
  input: {
    minHeight: tablet.touchMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tablet.radius,
    paddingHorizontal: 16,
    fontSize: tablet.fontBody,
    backgroundColor: colors.surface,
    color: colors.text,
    marginBottom: 12,
  },
  textArea: { minHeight: 72, textAlignVertical: "top", paddingTop: 12 },
  cancel: { marginTop: 8 },
});
