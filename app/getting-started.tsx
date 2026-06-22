import { Stack } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function GettingStartedScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Getting Started" }} />

      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.sectionTitle}>Before Your First Delivery</Text>

          <View style={styles.card}>
            <Text style={styles.stepTitle}>1️⃣ Search for a Stop</Text>

            <Text style={styles.step}>Search for the delivery address or business name.</Text>

            <Text style={styles.stepTitle}>2️⃣ Open the Preview Card</Text>

            <Text style={styles.step}>Tap the stop pin to view available stop intel.</Text>

            <Text style={styles.stepTitle}>3️⃣ Review Driver Reports</Text>

            <Text style={styles.step}>Read delivery tips and notes shared by other drivers.</Text>

            <Text style={styles.stepTitle}>4️⃣ Review the Delivery Zone</Text>

            <Text style={styles.step}>Locate the best delivery location before arriving.</Text>

            <Text style={styles.stepTitle}>5️⃣ Review Photos</Text>

            <Text style={styles.step}>View available photos before arriving at the stop.</Text>

            <Text style={styles.stepTitle}>6️⃣ Deliver with Confidence</Text>

            <Text style={styles.step}>
              Use the available stop intel before arriving at the delivery.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 20,
  },

  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
  },

  step: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});
