import { Platform } from "react-native";

/**
 * FreightIQ Sunrise System source colors.
 *
 * Brand and surface values are copied from the approved website implementation.
 * Operational colors preserve the app's existing status meanings.
 */
export const RawColors = {
  charcoal: "#090c0f",
  charcoalDeep: "#080b0d",
  charcoalSurface: "#111518",
  charcoalElevated: "#171c20",
  warmWhite: "#f7f4ef",
  lightStone: "#f1eee8",
  lightStoneSurface: "#e8e3db",
  stone: "#d6d0c7",
  ink: "#171513",
  sunriseDeep: "#a94121",
  sunriseCopper: "#d7672c",
  sunriseOrange: "#f39a3f",
  sunriseAmber: "#ffd27a",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#b91c1c",
  white: "#ffffff",
  black: "#000000",
} as const;

/**
 * Components consume these semantic values rather than raw colors.
 *
 * The legacy Expo keys remain as aliases while existing screens migrate to the
 * V2 design system one verified increment at a time.
 */
export const Colors = {
  light: {
    background: RawColors.lightStone,
    surface: RawColors.warmWhite,
    surfaceElevated: RawColors.white,
    textPrimary: RawColors.ink,
    textSecondary: "rgba(23, 21, 19, 0.68)",
    border: RawColors.stone,
    accent: RawColors.sunriseOrange,
    accentStrong: RawColors.sunriseCopper,
    accentMuted: "rgba(243, 154, 63, 0.14)",
    textOnAccent: "#120b06",
    success: RawColors.success,
    warning: RawColors.warning,
    danger: RawColors.danger,
    disabled: "rgba(23, 21, 19, 0.38)",
    overlay: "rgba(9, 12, 15, 0.48)",
    focusRing: "rgba(243, 154, 63, 0.28)",
    text: RawColors.ink,
    tint: RawColors.sunriseOrange,
    icon: "rgba(23, 21, 19, 0.68)",
    tabIconDefault: "rgba(23, 21, 19, 0.58)",
    tabIconSelected: RawColors.sunriseCopper,
  },
  dark: {
    background: RawColors.charcoal,
    surface: RawColors.charcoalSurface,
    surfaceElevated: RawColors.charcoalElevated,
    textPrimary: RawColors.warmWhite,
    textSecondary: RawColors.stone,
    border: "rgba(247, 244, 239, 0.10)",
    accent: RawColors.sunriseOrange,
    accentStrong: RawColors.sunriseAmber,
    accentMuted: "rgba(243, 154, 63, 0.16)",
    textOnAccent: "#120b06",
    success: RawColors.success,
    warning: RawColors.warning,
    danger: RawColors.danger,
    disabled: "rgba(247, 244, 239, 0.38)",
    overlay: "rgba(0, 0, 0, 0.64)",
    focusRing: "rgba(255, 210, 122, 0.30)",
    text: RawColors.warmWhite,
    tint: RawColors.sunriseOrange,
    icon: RawColors.stone,
    tabIconDefault: "rgba(214, 208, 199, 0.72)",
    tabIconSelected: RawColors.sunriseOrange,
  },
} as const;

export type AppColorScheme = keyof typeof Colors;
export type AppThemeColors = (typeof Colors)[AppColorScheme];
export type AppThemeColorName = keyof AppThemeColors;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const Sizes = {
  minimumTouchTarget: 44,
  compactControl: 44,
  input: 48,
  button: 48,
  mapControl: 48,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
} as const;

export const Borders = {
  thin: 1,
} as const;

export const Elevation = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  floating: {
    shadowColor: RawColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  sheet: {
    shadowColor: RawColors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

export const Typography = {
  screenTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  supporting: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  operationalLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
