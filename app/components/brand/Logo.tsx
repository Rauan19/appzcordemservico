import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { brandAssets } from "@/src/constants/brand";

type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ImageStyle>;
};

const sizes = {
  sm: { width: 120, height: 40 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 },
  xl: { width: 300, height: 100 },
};

export function Logo({ size = "md", style }: Props) {
  return (
    <Image
      source={brandAssets.logo}
      style={[styles.logo, sizes[size], style]}
      resizeMode="contain"
      accessibilityLabel="ZCnet"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    maxWidth: "100%",
  },
});
