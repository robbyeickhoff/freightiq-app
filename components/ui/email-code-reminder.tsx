import { StyleSheet, Text } from "react-native";

import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export function EmailCodeReminder() {
  const { colors } = useAppTheme();

  return (
    <Text style={[styles.reminder, { color: colors.textPrimary }]}>
      Don’t see your code? Check your Spam or Junk folder.
    </Text>
  );
}

const styles = StyleSheet.create({
  reminder: { ...Typography.sectionTitle, fontWeight: "600" },
});
