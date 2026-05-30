import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { brandAssets, brandName } from "@/src/constants/brand";
import { colors } from "@/src/constants/theme";

export function AppSplash() {
  return (
    <View style={styles.root}>
      <View style={styles.decor} />
      <View style={styles.decor2} />

      <Image source={brandAssets.logo} style={styles.logo} resizeMode="contain" accessibilityLabel="ZCnet" />

      <Text style={styles.title}>{brandName}</Text>
      <Text style={styles.subtitle}>App do técnico</Text>

      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.headerBg,
    paddingHorizontal: 32,
  },
  decor: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(43, 140, 255, 0.18)",
    top: -80,
    right: -60,
  },
  decor2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(30, 91, 184, 0.28)",
    bottom: 48,
    left: -50,
  },
  logo: {
    width: 280,
    height: 96,
    maxWidth: "82%",
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "800",
    color: colors.headerText,
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
  },
  loader: {
    marginTop: 36,
  },
});
