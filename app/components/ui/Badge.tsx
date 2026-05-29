import { StyleSheet, Text, View } from "react-native";
import { tablet } from "@/src/constants/theme";

type Props = {
  label: string;
  color: string;
};

export function Badge({ label, color }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: { fontSize: tablet.fontSmall, fontWeight: "700" },
});
