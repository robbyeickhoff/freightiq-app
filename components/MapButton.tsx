import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/context/theme-context";

type MapButtonProps = {
  children: ReactNode;
};

export function MapButton({ children }: MapButtonProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.text, { color: colors.textPrimary }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 14,
  },
});
