import { ScrollView, StyleSheet, View, useWindowDimensions, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, tablet } from "@/src/constants/theme";

type Props = ViewProps & {
  scroll?: boolean;
  children: React.ReactNode;
  padded?: boolean;
  /** Abas inferiores já tratam o rodapé  padrão sem inset bottom */
  safeEdges?: ("top" | "right" | "bottom" | "left")[];
};

export function Screen({
  scroll,
  children,
  style,
  padded = true,
  safeEdges = ["top", "left", "right"],
  ...rest
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const horizontalPad = padded ? (isWide ? tablet.padding : 16) : 0;

  const content = (
    <View
      style={[styles.inner, { paddingHorizontal: horizontalPad }, style]}
      {...rest}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: tablet.maxContentWidth,
    alignSelf: "center",
    paddingVertical: tablet.padding,
  },
});
