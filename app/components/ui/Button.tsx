import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, shadows, tablet } from "@/src/constants/theme";

type Props = Omit<PressableProps, "style"> & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, loading, variant = "primary", disabled, style, ...rest }: Props) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.base,
          isPrimary && styles.primary,
          isSecondary && styles.secondary,
          isDanger && styles.danger,
          isGhost && styles.ghost,
          isPrimary && shadows.button,
          (disabled || loading) && styles.disabled,
          pressed && !disabled && styles.pressed,
          style,
        ])
      }
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={isGhost || isSecondary ? colors.primary : "#fff"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isDanger && styles.textPrimary,
            isSecondary && styles.textSecondary,
            isGhost && styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tablet.touchMinHeight,
    borderRadius: tablet.radius,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88 },
  text: { fontSize: tablet.fontBody, fontWeight: "700" },
  textPrimary: { color: "#fff" },
  textSecondary: { color: colors.primary },
  textGhost: { color: colors.primary },
});
