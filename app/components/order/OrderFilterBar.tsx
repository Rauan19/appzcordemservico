import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ServiceOrderStatus } from "@/src/types/api";
import {
  statusBackgroundColors,
  statusColors,
  statusLabels,
} from "@/src/utils/status";
import { colors, shadows, tablet } from "@/src/constants/theme";

export type OrderFilterOption = {
  label: string;
  shortLabel?: string;
  value?: ServiceOrderStatus;
  icon: keyof typeof Ionicons.glyphMap;
};

export const orderFilterOptions: OrderFilterOption[] = [
  { label: "Todas", shortLabel: "Todas", icon: "layers-outline" },
  { label: "Abertas", shortLabel: "Abertas", value: "OPEN", icon: "folder-open-outline" },
  { label: "Atribuídas", shortLabel: "Atrib.", value: "ASSIGNED", icon: "person-outline" },
  { label: "Em execução", shortLabel: "Execução", value: "IN_PROGRESS", icon: "construct-outline" },
  { label: "Finalizadas", shortLabel: "Final.", value: "DONE", icon: "checkmark-done-outline" },
];

type Props = {
  filter?: ServiceOrderStatus;
  count: number;
  loading: boolean;
  onChange: (value?: ServiceOrderStatus) => void;
};

export function OrderFilterBar({ filter, count, loading, onChange }: Props) {
  const activeLabel = filter ? statusLabels[filter] : "Todas";

  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {loading ? "Atualizando…" : `${count} ${count === 1 ? "ordem" : "ordens"}`}
        </Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>{activeLabel}</Text>
        </View>
      </View>

      <View style={styles.bar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {orderFilterOptions.map((f) => {
            const active = filter === f.value;
            const accent = f.value ? statusColors[f.value] : colors.primary;
            const bg = f.value ? statusBackgroundColors[f.value] : colors.accentLight;

            return (
              <Pressable
                key={f.label}
                onPress={() => onChange(f.value)}
                style={({ pressed }) => [
                  styles.chip,
                  active && {
                    backgroundColor: bg,
                    borderColor: accent,
                  },
                  pressed && styles.chipPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: active ? `${accent}22` : colors.background },
                  ]}
                >
                  <Ionicons
                    name={f.icon}
                    size={16}
                    color={active ? accent : colors.textMuted}
                  />
                </View>
                <Text
                  style={[styles.chipLabel, active && { color: accent, fontWeight: "800" }]}
                  numberOfLines={1}
                >
                  {f.shortLabel ?? f.label}
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bar: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 8,
    padding: 8,
    paddingRight: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.background,
    minWidth: 88,
  },
  chipPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    maxWidth: 72,
  },
});
