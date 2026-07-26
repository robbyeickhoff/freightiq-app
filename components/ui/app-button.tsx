import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Borders, Radius, RawColors, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export type AppButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type AppButtonSize = "standard" | "compact" | "icon";

export type AppButtonProps = Omit<PressableProps, "children" | "disabled" | "style"> & {
  children: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: AppButtonVariant;
};

export function AppButton({
  accessibilityState,
  children,
  disabled = false,
  fullWidth = false,
  loading = false,
  onBlur,
  onFocus,
  size = "standard",
  style,
  textStyle,
  variant = "primary",
  ...props
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [isFocused, setIsFocused] = useState(false);
  const interactionDisabled = disabled || loading;
  const usesAccessibilityLayout = fontScale >= 1.5 && size !== "icon";

  const variantColors = {
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      labelColor: colors.textOnAccent,
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      labelColor: colors.textPrimary,
    },
    tertiary: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      labelColor: colors.accentStrong,
    },
    destructive: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
      labelColor: RawColors.white,
    },
  }[variant];

  const disabledColors =
    variant === "tertiary"
      ? {
          backgroundColor: "transparent",
          borderColor: "transparent",
          labelColor: colors.disabled,
        }
      : {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          labelColor: colors.disabled,
        };

  const activeColors = disabled ? disabledColors : variantColors;
  const isTextLabel = typeof children === "string" || typeof children === "number";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: interactionDisabled,
      }}
      disabled={interactionDisabled}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: activeColors.backgroundColor,
          borderColor: isFocused ? colors.accentStrong : activeColors.borderColor,
          borderWidth: isFocused ? 2 : Borders.thin,
        },
        fullWidth ? styles.fullWidth : null,
        usesAccessibilityLayout ? styles.accessibilityLayout : null,
        pressed ? styles.pressed : null,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={activeColors.labelColor} size="small" /> : null}
      {isTextLabel ? (
        <Text
          numberOfLines={usesAccessibilityLayout ? undefined : 1}
          style={[styles.label, { color: activeColors.labelColor }, textStyle]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
    gap: Spacing.xs,
  },
  standard: {
    minHeight: Sizes.button,
    paddingHorizontal: Spacing.lg,
  },
  compact: {
    minHeight: Sizes.minimumTouchTarget,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    width: Sizes.minimumTouchTarget,
    height: Sizes.minimumTouchTarget,
    paddingHorizontal: 0,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  accessibilityLayout: {
    height: "auto",
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...Typography.buttonLabel,
    flexShrink: 1,
    textAlign: "center",
  },
});
