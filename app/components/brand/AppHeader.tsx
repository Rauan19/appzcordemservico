import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "@/components/brand/Logo";
import { colors, tablet } from "@/src/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.decor} />
      <View style={styles.inner}>
        <Logo size="sm" style={styles.logo} />
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.headerBg,
    paddingBottom: 16,
    paddingHorizontal: tablet.padding,
    overflow: "hidden",
  },
  decor: {
    position: "absolute",
    right: -40,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(43, 140, 255, 0.25)",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  titles: { flex: 1 },
  title: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.headerText,
  },
  subtitle: {
    fontSize: tablet.fontSmall,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
});
