import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, tablet } from "@/src/constants/theme";

type Props = TextInputProps & {
  label: string;
};

export function Input({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: tablet.fontSmall,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: tablet.touchMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tablet.radius,
    paddingHorizontal: 16,
    fontSize: tablet.fontBody,
    backgroundColor: colors.background,
    color: colors.text,
  },
});
