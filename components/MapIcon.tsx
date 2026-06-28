import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";

type MapIconProps = {
  children: ReactNode;
};

export function MapIcon({ children }: MapIconProps) {
  return <Text style={styles.icon}>{children}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    marginBottom: 1,
  },
});
