import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { Product } from "@/src/types/api";
import { colors, shadows, tablet } from "@/src/constants/theme";

type Props = {
  product: Product;
  balance: number;
};

function stockStatus(balance: number) {
  if (balance <= 0) {
    return {
      label: "Sem saldo",
      accent: colors.textMuted,
      bg: "#F1F5F9",
      border: colors.border,
    };
  }
  if (balance <= 5) {
    return {
      label: "Baixo",
      accent: colors.warning,
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  }
  return {
    label: "Disponível",
    accent: colors.success,
    bg: "#ECFDF5",
    border: "#A7F3D0",
  };
}

export function StockListCard({ product, balance }: Props) {
  const status = stockStatus(balance);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: status.bg,
          borderColor: status.border,
        },
      ]}
    >
      <View style={[styles.statusBar, { backgroundColor: status.accent }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${status.accent}18` }]}>
            <Ionicons name="cube-outline" size={18} color={status.accent} />
          </View>
          <View style={[styles.badge, { borderColor: `${status.accent}44` }]}>
            <Text style={[styles.badgeText, { color: status.accent }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.sku ? (
          <View style={styles.metaRow}>
            <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{product.sku}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={[styles.qtyBox, { borderColor: `${status.accent}33` }]}>
            <Text style={[styles.qty, { color: status.accent }]}>{balance}</Text>
            <Text style={styles.unit}>{product.unit}</Text>
          </View>
          <Text style={styles.hint}>
            {balance <= 0
              ? "Indisponível para lançamento"
              : balance <= 5
                ? "Saldo crítico  avise o almoxarifado"
                : "Pronto para uso em OS"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    ...shadows.card,
  },
  statusBar: {
    height: 4,
    width: "100%",
  },
  body: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  name: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  meta: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 23, 42, 0.06)",
  },
  qtyBox: {
    alignItems: "center",
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  qty: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
  },
  unit: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
  hint: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontWeight: "600",
  },
});
