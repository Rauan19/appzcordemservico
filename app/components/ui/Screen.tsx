import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewProps,
} from "react-native";
import { colors, tablet } from "@/src/constants/theme";

type Props = ViewProps & {
  scroll?: boolean;
  children: React.ReactNode;
  padded?: boolean;
};

export function Screen({ scroll, children, style, padded = true, ...rest }: Props) {
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
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;
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
