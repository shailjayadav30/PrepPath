import { Platform, ViewStyle } from "react-native";

// Shared palette so every screen uses the same greens, greys and surfaces
export const colors = {
  primary: "#16A673",
  primaryDark: "#0F5132",
  primaryTint: "#E8F6F1",
  primarySoft: "#F3FAF7",

  bg: "#F5F8F6",
  card: "#FFFFFF",
  border: "#E3EEE9",
  divider: "#EEF4F1",

  text: "#14231C",
  textSecondary: "#5F6F68",
  textMuted: "#94A39C",

  danger: "#D64545",
  dangerTint: "#FDECEC",
  warning: "#9A6B00",
  warningTint: "#FFF8E6",
  white: "#FFFFFF",
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const shadow: Record<"card" | "raised", ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    default: { elevation: 2 },
  })!,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    default: { elevation: 5 },
  })!,
};
