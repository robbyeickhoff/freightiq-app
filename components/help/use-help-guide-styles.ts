import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { Borders, Radius, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export function useHelpGuideStyles() {
  const { colors } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          paddingHorizontal: Spacing.md,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.xxl,
        },
        step: {
          ...Typography.body,
          color: colors.textPrimary,
        },
        iconRow: {
          flexDirection: "row",
          alignItems: "flex-start",
        },
        iconLeft: {
          width: 36,
          marginRight: Spacing.sm,
          paddingTop: 1,
        },
        stepText: {
          flex: 1,
          flexShrink: 1,
          ...Typography.body,
          color: colors.textPrimary,
        },
        stepTitle: {
          ...Typography.body,
          color: colors.textPrimary,
          fontWeight: "700",
        },
        sectionTitle: {
          ...Typography.screenTitle,
          color: colors.textPrimary,
          marginBottom: Spacing.xs,
        },
        helperText: {
          ...Typography.body,
          color: colors.textSecondary,
          marginBottom: Spacing.md,
        },
        body: {
          ...Typography.body,
          color: colors.textSecondary,
          marginBottom: Spacing.md,
        },
        expandedHeader: {
          minHeight: 52,
          justifyContent: "center",
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderWidth: Borders.thin,
          borderRadius: Radius.large,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          marginBottom: Spacing.xs,
        },
        contentPanel: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: Borders.thin,
          borderRadius: Radius.large,
          marginHorizontal: Spacing.sm,
          marginBottom: Spacing.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
        },
        exampleItem: {
          marginBottom: Spacing.sm,
        },
        buttonWrapper: {
          width: "70%",
          alignSelf: "flex-start",
          marginBottom: Spacing.xxs,
        },
        exampleText: {
          marginTop: Spacing.xxs,
          ...Typography.body,
          color: colors.textPrimary,
        },
      }),
    [colors],
  );
}
