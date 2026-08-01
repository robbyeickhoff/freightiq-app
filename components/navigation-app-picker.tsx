import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { Borders, Elevation, Radius, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  navigationProviderLabel,
  type NavigationProvider,
} from "@/utils/navigation-apps";

type NavigationAppPickerProps = {
  destinationLabel: string;
  onClose: () => void;
  onSelect: (provider: NavigationProvider) => void;
  providers: NavigationProvider[];
  visible: boolean;
};

export function NavigationAppPicker({
  destinationLabel,
  onClose,
  onSelect,
  providers,
  visible,
}: NavigationAppPickerProps) {
  const { colors } = useAppTheme();
  const reduceMotionEnabled = useReducedMotion();

  return (
    <Modal
      animationType={reduceMotionEnabled ? "none" : "slide"}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            Elevation.sheet,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Navigate with</Text>
          <Text numberOfLines={2} style={[styles.destination, { color: colors.textSecondary }]}>
            {destinationLabel}
          </Text>

          <ScrollView contentContainerStyle={styles.optionList}>
            {providers.map((provider) => (
              <Pressable
                accessibilityHint={`Opens directions in ${navigationProviderLabel(provider)}`}
                accessibilityRole="button"
                key={provider}
                onPress={() => onSelect(provider)}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: colors.border },
                  pressed ? { backgroundColor: colors.accentMuted } : null,
                ]}
              >
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                  {navigationProviderLabel(provider)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <AppButton fullWidth onPress={onClose} variant="secondary">
            Cancel
          </AppButton>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    borderWidth: Borders.thin,
    maxHeight: "82%",
    padding: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
  },
  destination: {
    ...Typography.body,
    marginTop: Spacing.xxs,
  },
  optionList: {
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  option: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: Borders.thin,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionLabel: {
    ...Typography.buttonLabel,
    textAlign: "center",
  },
});
