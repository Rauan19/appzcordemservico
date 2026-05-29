import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, tablet } from "@/src/constants/theme";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function Rating010Picker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.valueLabel}>
        Nota do cliente: <Text style={styles.valueStrong}>{value}</Text>/10
      </Text>
      <View style={styles.grid}>
        {scores.map((score) => {
          const active = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  valueLabel: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    fontWeight: "600",
  },
  valueStrong: {
    fontSize: tablet.fontSubtitle,
    color: colors.primary,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: tablet.fontBody,
    fontWeight: "700",
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primary,
  },
});
