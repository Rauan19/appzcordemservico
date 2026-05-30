import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { ServiceOrderStatus } from "@/src/types/api";
import { statusColors, statusLabels } from "@/src/utils/status";
import { colors } from "@/src/constants/theme";

const STEPS: ServiceOrderStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE"];

const stepIcons: Record<ServiceOrderStatus, keyof typeof Ionicons.glyphMap> = {
  OPEN: "folder-open-outline",
  ASSIGNED: "person-outline",
  IN_PROGRESS: "construct-outline",
  DONE: "checkmark-done-outline",
  CANCELED: "close-outline",
};

type Props = {
  status: ServiceOrderStatus;
};

export function OrderStatusTimeline({ status }: Props) {
  if (status === "CANCELED") {
    return (
      <View style={[styles.canceledBox, { borderColor: `${statusColors.CANCELED}44` }]}>
        <Ionicons name="close-circle" size={20} color={statusColors.CANCELED} />
        <Text style={[styles.canceledText, { color: statusColors.CANCELED }]}>
          Ordem cancelada
        </Text>
      </View>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        const color = done ? statusColors[step] : colors.border;
        const isLast = idx === STEPS.length - 1;

        return (
          <View key={step} style={styles.step}>
            <View style={styles.stepTop}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done ? color : colors.surface,
                    borderColor: color,
                  },
                  active && styles.dotActive,
                ]}
              >
                {done ? (
                  <Ionicons name={stepIcons[step]} size={14} color={active ? "#fff" : color} />
                ) : null}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: idx < currentIdx ? statusColors[STEPS[idx + 1]!] : colors.border },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                active && { color: statusColors[step], fontWeight: "800" },
              ]}
              numberOfLines={1}
            >
              {statusLabels[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  step: {
    flex: 1,
    alignItems: "center",
  },
  stepTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dotActive: {
    transform: [{ scale: 1.08 }],
  },
  line: {
    position: "absolute",
    left: "55%",
    right: "-45%",
    height: 2,
    top: 13,
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  canceledBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FEF2F2",
  },
  canceledText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
