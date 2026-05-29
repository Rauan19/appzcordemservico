import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, shadows, tablet } from "@/src/constants/theme";

type Variant = "default" | "elevated" | "accent" | "muted";

type Props = Omit<PressableProps, "style"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** @deprecated use variant="accent" */
  accent?: boolean;
  variant?: Variant;
  compact?: boolean;
  showChevron?: boolean;
  title?: string;
  subtitle?: string;
};

export function Card({
  children,
  style,
  accent,
  variant: variantProp,
  compact,
  showChevron,
  title,
  subtitle,
  ...rest
}: Props) {
  const variant: Variant = variantProp ?? (accent ? "accent" : "default");
  const isPressable = Boolean(rest.onPress);
  const showArrow = isPressable && showChevron !== false;

  const cardStyle = StyleSheet.flatten([
    styles.base,
    styles[variant],
    isPressable && styles.pressable,
    style,
  ]);

  const body = (
    <>
      {variant === "accent" && <View style={styles.accentGlow} pointerEvents="none" />}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      <View
        style={[
          styles.body,
          compact && styles.bodyCompact,
          showArrow && styles.bodyWithChevron,
        ]}
      >
        <View style={styles.content}>{children}</View>
        {showArrow && (
          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </View>
        )}
      </View>
    </>
  );

  if (isPressable) {
    return (
      <Pressable
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        android_ripple={{ color: colors.accentLight }}
        {...rest}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{body}</View>;
}

/** Linha divisória dentro do card */
export function CardDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tablet.radiusLg,
    marginBottom: tablet.gap,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  default: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.cardElevated,
  },
  accent: {
    backgroundColor: "#FAFCFF",
    borderColor: "#C7D9F5",
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadows.card,
  },
  muted: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  bodyCompact: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressable: {
    ...shadows.cardElevated,
  },
  accentGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(43, 140, 255, 0.06)",
  },
  header: {
    paddingHorizontal: tablet.padding,
    paddingTop: tablet.padding,
    paddingBottom: 4,
  },
  title: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.primary,
  },
  subtitle: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    padding: tablet.padding,
  },
  bodyWithChevron: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  chevronWrap: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
});
