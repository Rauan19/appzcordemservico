export const colors = {
  primary: "#0B2D6B",
  primaryDark: "#071F4D",
  primaryLight: "#1E5BB8",
  accent: "#2B8CFF",
  accentLight: "#E8F2FF",
  background: "#F0F4FA",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
  headerBg: "#0B2D6B",
  headerText: "#FFFFFF",
  shadow: "rgba(11, 45, 107, 0.12)",
};

export const tablet = {
  maxContentWidth: 900,
  padding: 24,
  gap: 16,
  touchMinHeight: 52,
  fontTitle: 28,
  fontSubtitle: 18,
  fontBody: 16,
  fontSmall: 14,
  radius: 14,
  radiusLg: 20,
};

export const shadows = {
  card: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
};
