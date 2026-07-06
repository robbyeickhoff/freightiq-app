import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type ProfileFormProps = {
  name: string;
  onChangeName: (value: string) => void;
  tractorType: string;
  onPressSelectTractorType: () => void;
  labelMarginTop?: number;
};

export default function ProfileForm({
  name,
  onChangeName,
  tractorType,
  onPressSelectTractorType,
  labelMarginTop = 24,
}: ProfileFormProps) {
  return (
    <>
      <Text style={[styles.label, { marginTop: labelMarginTop }]}>Driver Name</Text>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder="Your name"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: labelMarginTop }]}>Tractor Type</Text>
      <View style={styles.selectorGroup}>
        <Pressable style={styles.option} onPress={onPressSelectTractorType}>
          <View style={styles.selectorRow}>
            <Text style={tractorType ? styles.selectedTractorValue : styles.selectorPlaceholder}>
              {tractorType || "Select tractor type"}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  selectorGroup: {
    marginTop: 8,
  },

  label: {
    fontWeight: "600",
    marginTop: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },

  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 4,
  },

  selectorPlaceholder: {
    color: "#555",
  },

  selectedTractorValue: {
    color: "black",
    fontWeight: "500",
  },

  chevron: {
    color: "#9ca3af",
    fontSize: 24,
  },
});
