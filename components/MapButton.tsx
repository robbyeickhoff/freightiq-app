import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type MapButtonProps = {
  children: ReactNode;
};

export function MapButton({ children }: MapButtonProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
    backgroundColor: "white",
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
    color: "#111",
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 14,
  },
});
