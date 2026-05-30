import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, shadows, tablet } from "@/src/constants/theme";

export type StockFilter = "all" | "available" | "low" | "empty";

export const stockFilterOptions: Array<{
  label: string;
  shortLabel: string;
  value: StockFilter;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  bg: string;
}> = [
  {
    label: "Todos",
    shortLabel: "Todos",
    value: "all",
    icon: "layers-outline",
    accent: colors.primary,
    bg: colors.accentLight,
  },
  {
    label: "Com saldo",
    shortLabel: "Saldo",
    value: "available",
    icon: "checkmark-circle-outline",
    accent: colors.success,
    bg: "#ECFDF5",
  },
  {
    label: "Baixo",
    shortLabel: "Baixo",
    value: "low",
    icon: "alert-circle-outline",
    accent: colors.warning,
    bg: "#FFFBEB",
  },
  {
    label: "Zerado",
    shortLabel: "Zerado",
    value: "empty",
    icon: "close-circle-outline",
    accent: colors.textMuted,
    bg: "#F1F5F9",
  },
];

type Props = {
  filter: StockFilter;
  count: number;
  total: number;
  lowCount: number;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (value: StockFilter) => void;
};

export function StockFilterBar({
  filter,
  count,
  total,
  lowCount,
  loading,
  search,
  onSearchChange,
  onChange,
}: Props) {
  const active = stockFilterOptions.find((f) => f.value === filter) ?? stockFilterOptions[0];

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>produtos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, lowCount > 0 && styles.summaryWarn]}>{lowCount}</Text>
          <Text style={styles.summaryLabel}>saldo baixo</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{count}</Text>
          <Text style={styles.summaryLabel}>na lista</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Buscar por nome ou SKU..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {loading ? "Atualizando…" : `${count} ${count === 1 ? "item" : "itens"}`}
        </Text>
        <View style={[styles.activePill, { backgroundColor: active.bg, borderColor: `${active.accent}44` }]}>
          <Text style={[styles.activePillText, { color: active.accent }]}>{active.shortLabel}</Text>
        </View>
      </View>

      <View style={styles.bar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {stockFilterOptions.map((f) => {
            const isActive = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => onChange(f.value)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && {
                    backgroundColor: f.bg,
                    borderColor: f.accent,
                  },
                  pressed && styles.chipPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: isActive ? `${f.accent}22` : colors.background },
                  ]}
                >
                  <Ionicons
                    name={f.icon}
                    size={16}
                    color={isActive ? f.accent : colors.textMuted}
                  />
                </View>
                <Text style={[styles.chipLabel, isActive && { color: f.accent, fontWeight: "800" }]}>
                  {f.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    ...shadows.card,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: tablet.radius,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: "#C7D9F5",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },
  summaryWarn: {
    color: colors.warning,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#C7D9F5",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: tablet.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: tablet.fontBody,
    color: colors.text,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  metaText: {
    fontSize: tablet.fontSmall,
    fontWeight: "700",
    color: colors.textMuted,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  bar: {
    paddingLeft: 16,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: tablet.fontSmall,
    fontWeight: "700",
    color: colors.text,
  },
});
