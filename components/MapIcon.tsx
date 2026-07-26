import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/context/theme-context";

type MapIconProps = {
  children: ReactNode;
};

export function MapIcon({ children }: MapIconProps) {
  const { colors } = useAppTheme();

  return <Text style={[styles.icon, { color: colors.textPrimary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 1,
  },
});
