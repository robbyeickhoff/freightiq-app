import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Borders, Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";

type TextFieldTrailingAction = {
  accessibilityLabel: string;
  icon: AppIconName;
  onPress: () => void;
};

export type AppTextFieldProps = Omit<TextInputProps, "editable" | "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  error?: string;
  inputStyle?: StyleProp<TextStyle>;
  label: string;
  successMessage?: string;
  supportingText?: string;
  trailingAction?: TextFieldTrailingAction;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(
  function AppTextField(
    {
      accessibilityLabel,
      containerStyle,
      disabled = false,
      error,
      inputStyle,
      label,
      multiline = false,
      onBlur,
      onFocus,
      placeholderTextColor,
      successMessage,
      supportingText,
      trailingAction,
      ...props
    },
    ref,
  ) {
    const { colorScheme, colors } = useAppTheme();
    const [isFocused, setIsFocused] = useState(false);
    const message = error ?? successMessage ?? supportingText;
    const messageColor = error
      ? colors.danger
      : successMessage
        ? colors.success
        : colors.textSecondary;
    const borderColor = error
      ? colors.danger
      : isFocused
        ? colors.accentStrong
        : colors.border;

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={[styles.label, { color: disabled ? colors.disabled : colors.textPrimary }]}>
          {label}
        </Text>
        <View style={styles.inputShell}>
          <TextInput
            ref={ref}
            accessibilityLabel={accessibilityLabel ?? label}
            cursorColor={colors.accentStrong}
            editable={!disabled}
            keyboardAppearance={colorScheme}
            multiline={multiline}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
            selectionColor={colors.accent}
            style={[
              styles.input,
              multiline ? styles.multiline : null,
              trailingAction ? styles.inputWithTrailingAction : null,
              {
                backgroundColor: disabled ? colors.surface : colors.surfaceElevated,
                borderColor,
                borderWidth: error || isFocused ? 2 : Borders.thin,
                color: disabled ? colors.disabled : colors.textPrimary,
              },
              inputStyle,
            ]}
            {...props}
          />
          {trailingAction ? (
            <Pressable
              accessibilityLabel={trailingAction.accessibilityLabel}
              accessibilityRole="button"
              hitSlop={Spacing.xs}
              onPress={trailingAction.onPress}
              style={({ pressed }) => [styles.trailingAction, pressed ? styles.pressed : null]}
            >
              <AppIcon color={colors.textSecondary} name={trailingAction.icon} size={24} />
            </Pressable>
          ) : null}
        </View>
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.message, { color: messageColor }]}
          >
            {message}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
  },
  input: {
    minHeight: Sizes.input,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
  },
  inputShell: {
    position: "relative",
  },
  inputWithTrailingAction: {
    paddingRight: Sizes.minimumTouchTarget + Spacing.sm,
  },
  trailingAction: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.xs,
    top: 0,
    width: Sizes.minimumTouchTarget,
  },
  pressed: {
    opacity: 0.6,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: "top",
  },
  message: {
    ...Typography.supporting,
  },
});
