import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import { AppChoiceChip } from "./app-choice-chip";

export type AppSegmentedOption<Value extends string> = {
  disabled?: boolean;
  label: string;
  value: Value;
};

export type AppSegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  disabled?: boolean;
  onChange: (value: Value) => void;
  options: readonly AppSegmentedOption<Value>[];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  value: Value;
};

export function AppSegmentedControl<Value extends string>({
  accessibilityLabel,
  disabled = false,
  onChange,
  options,
  style,
  textStyle,
  value,
}: AppSegmentedControlProps<Value>) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={[styles.container, style]}
    >
      {options.map((option) => (
        <AppChoiceChip
          key={option.value}
          accessibilityRole="radio"
          disabled={disabled || option.disabled}
          label={option.label}
          onPress={() => onChange(option.value)}
          selected={value === option.value}
          style={styles.segment}
          textStyle={textStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
  },
});
