import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Badge } from "@/components/ui/Badge";
import type { ServiceOrder } from "@/src/types/api";
import {
  priorityColors,
  priorityLabels,
  statusBackgroundColors,
  statusBorderColors,
  statusColors,
  statusLabels,
} from "@/src/utils/status";
import { colors, shadows, tablet } from "@/src/constants/theme";
import { formatDate } from "@/src/utils/dates";

type Props = {
  order: ServiceOrder;
  onPress: () => void;
};

function AnimatedAlertIcon() {
  const shake = useSharedValue(0);

  useEffect(() => {
    shake.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 80, easing: Easing.linear }),
        withTiming(1, { duration: 80, easing: Easing.linear }),
        withTiming(-1, { duration: 80, easing: Easing.linear }),
        withTiming(1, { duration: 80, easing: Easing.linear }),
        withTiming(0, { duration: 80, easing: Easing.linear }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
    );
  }, [shake]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 3 },
      { rotate: `${shake.value * 14}deg` },
    ],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
    </Animated.View>
  );
}

function ScheduledDateBanner({ scheduledAt }: { scheduledAt: string }) {
  return (
    <View style={styles.scheduledBanner}>
      <AnimatedAlertIcon />
      <Text style={styles.scheduledLabel}>Agendada:</Text>
      <Text style={styles.scheduledDate}>{formatDate(scheduledAt)}</Text>
    </View>
  );
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrderListCard({ order, onPress }: Props) {
  const accent = statusColors[order.status];
  const priorityColor = priorityColors[order.priority] ?? colors.textMuted;
  const addressLine = [order.address?.street, order.address?.number, order.address?.city]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: statusBackgroundColors[order.status],
            borderColor: statusBorderColors[order.status],
          },
        ]}
      >
        <View style={[styles.statusBar, { backgroundColor: accent }]} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={[styles.codePill, { borderColor: `${accent}55` }]}>
              <Ionicons name="receipt-outline" size={13} color={accent} />
              <Text style={[styles.code, { color: accent }]}>{order.code}</Text>
            </View>
            <Badge label={statusLabels[order.status]} color={accent} />
          </View>

          {order.scheduledAt ? (
            <ScheduledDateBanner scheduledAt={order.scheduledAt} />
          ) : null}

          <Text style={styles.title} numberOfLines={2}>
            {order.title}
          </Text>

          {order.createdAt ? (
            <Text style={styles.createdText}>Criada: {formatDate(order.createdAt)}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.customerBlock}>
              <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}>
                <Text style={[styles.avatarText, { color: accent }]}>
                  {initials(order.customer?.fullName)}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {order.customer?.fullName ?? "Cliente"}
                </Text>
                {addressLine ? (
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.address} numberOfLines={1}>
                      {addressLine}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}14` }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {priorityLabels[order.priority] ?? order.priority}
                </Text>
              </View>
              <View style={[styles.chevron, { backgroundColor: `${accent}18` }]}>
                <Ionicons name="chevron-forward" size={18} color={accent} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.cardElevated,
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
    gap: 10,
    marginBottom: 12,
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  code: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginTop: 10,
  },
  scheduledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  scheduledLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.warning,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  scheduledDate: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.warning,
  },
  createdText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    marginVertical: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  customerBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontSize: tablet.fontSmall,
    fontWeight: "700",
    color: colors.text,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 10,
  },
  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
