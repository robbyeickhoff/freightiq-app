import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  type AccessibilityRole,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Borders, Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export type AppChoiceChipProps = Omit<
  PressableProps,
  "accessibilityRole" | "children" | "disabled" | "style"
> & {
  accessibilityRole?: Extract<AccessibilityRole, "button" | "radio">;
  disabled?: boolean;
  label: string;
  leadingIcon?: ReactNode;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppChoiceChip({
  accessibilityRole = "button",
  accessibilityState,
  disabled = false,
  label,
  leadingIcon,
  onBlur,
  onFocus,
  selected,
  style,
  textStyle,
  ...props
}: AppChoiceChipProps) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [isFocused, setIsFocused] = useState(false);
  const usesAccessibilityLayout = fontScale >= 1.5;
  const backgroundColor = disabled
    ? colors.surface
    : selected
      ? colors.accent
      : colors.surfaceElevated;
  const borderColor = disabled
    ? colors.border
    : isFocused
      ? colors.accentStrong
      : selected
        ? colors.accent
        : colors.border;
  const labelColor = disabled
    ? colors.disabled
    : selected
      ? colors.textOnAccent
      : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        checked: accessibilityRole === "radio" ? selected : undefined,
        disabled,
        selected,
      }}
      disabled={disabled}
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
        {
          backgroundColor,
          borderColor,
          borderWidth: isFocused ? 2 : Borders.thin,
        },
        usesAccessibilityLayout ? styles.accessibilityLayout : null,
        pressed ? styles.pressed : null,
        style,
      ]}
      {...props}
    >
      {leadingIcon}
      <Text
        numberOfLines={usesAccessibilityLayout ? undefined : 1}
        style={[styles.label, { color: labelColor }, textStyle]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Sizes.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  accessibilityLayout: {
    height: "auto",
    paddingVertical: Spacing.sm,
  },
  label: {
    ...Typography.buttonLabel,
    flexShrink: 1,
  },
});
