import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TRACTOR_TYPES = [
  "Single Axle Day Cab",
  "Tandem Axle Day Cab",
  "Tandem Axle Sleeper",
] as const;

export default function TractorTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tractorType?: string; returnTo?: string; name?: string }>();
  const returnTo: "/setup-profile" | "/(tabs)/profile" =
    params.returnTo === "/(tabs)/profile" ? "/(tabs)/profile" : "/setup-profile";
  const [selectedType, setSelectedType] = useState<string>(
    typeof params.tractorType === "string" && params.tractorType
      ? params.tractorType
      : TRACTOR_TYPES[0],
  );

  function handleSelect(option: string) {
    setSelectedType(option);
    router.navigate({ pathname: returnTo, params: { name: params.name, tractorType: option } });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Tractor Type",
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      <View style={styles.list}>
        {TRACTOR_TYPES.map((option, index) => {
          const isSelected = selectedType === option;
          const isLast = index === TRACTOR_TYPES.length - 1;

          return (
            <Pressable
              key={option}
              style={[styles.optionRow, !isLast && styles.optionRowBorder]}
              onPress={() => handleSelect(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
              {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: "white",
  },

  list: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
  },

  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
  },

  optionText: {
    fontSize: 16,
    color: "#111",
  },

  checkmark: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
});
