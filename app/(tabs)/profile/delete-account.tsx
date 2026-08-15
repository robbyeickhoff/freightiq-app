import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  findNodeHandle,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { supabase } from "@/utils/supabase";
import { clearAppLockPreference } from "@/utils/app-lock";

const DELETE_INPUT_ACCESSORY_ID = "delete-account-keyboard-toolbar";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const confirmationInputRef = useRef<TextInput>(null);
  const confirmationYRef = useRef(0);

  function beginConfirmation() {
    Alert.alert(
      "Permanently delete your account?",
      "This cannot be undone. Your profile, reports, votes, program records, referrals, private files, and contributor attribution will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: () => setConfirmed(true) },
      ],
    );
  }

  async function deleteAccount() {
    if (confirmationText !== "DELETE") return;
    setDeleting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error || data?.success !== true) {
      setDeleting(false);
      Alert.alert(
        "Account not deleted",
        "Your account remains active. Please check your connection and try again, or contact FreightIQ Support.",
      );
      return;
    }

    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    if (userId) await clearAppLockPreference(userId).catch(() => undefined);
    await AsyncStorage.clear();
    setDeleting(false);
    Alert.alert("Account deleted", "Your FreightIQ account has been permanently deleted.", [
      { text: "Done", onPress: () => router.replace("/auth") },
    ]);
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Permanent account deletion
        </Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Deleting your account removes your FreightIQ identity and user-linked contributions. You
          will be signed out on this device and cannot recover the account.
        </Text>

        <AppCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            What FreightIQ deletes
          </Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>
            Your profile, Driver Reports, votes, contacts, notes, private images, Founding Driver
            records, referrals, safety records, and contributor attribution.
          </Text>
        </AppCard>

        <AppCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>What may remain</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>
            Neutral business name, address, coordinates, and Delivery Zone may remain only after
            they are disconnected from your account. Your authored notes and contact information do
            not remain with that stop.
          </Text>
        </AppCard>

        {!confirmed ? (
          <AppButton onPress={beginConfirmation} variant="destructive">
            Begin Account Deletion
          </AppButton>
        ) : (
          <View
            onLayout={(event) => {
              confirmationYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <AppCard contentStyle={styles.confirmationCard}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Type DELETE to confirm
              </Text>
              <TextInput
                ref={confirmationInputRef}
                autoCapitalize="characters"
                autoCorrect={false}
                inputAccessoryViewID={Platform.OS === "ios" ? DELETE_INPUT_ACCESSORY_ID : undefined}
                onChangeText={setConfirmationText}
                onFocus={() => {
                  setTimeout(() => {
                    const inputHandle = findNodeHandle(confirmationInputRef.current);
                    if (inputHandle) {
                      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
                        inputHandle,
                        Platform.OS === "android" ? 96 : Spacing.md,
                        true,
                      );
                      return;
                    }

                    scrollViewRef.current?.scrollTo({
                      animated: true,
                      y: Math.max(0, confirmationYRef.current - Spacing.sm),
                    });
                  }, Platform.OS === "android" ? 300 : 150);
                }}
                placeholder="DELETE"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={confirmationText}
              />
              <AppButton
                disabled={confirmationText !== "DELETE"}
                loading={deleting}
                onPress={() => void deleteAccount()}
                variant="destructive"
              >
                Permanently Delete Account
              </AppButton>
              <AppButton disabled={deleting} onPress={() => setConfirmed(false)} variant="tertiary">
                Cancel
              </AppButton>
            </AppCard>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={DELETE_INPUT_ACCESSORY_ID}>
          <View
            style={[
              styles.keyboardToolbar,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <AppButton onPress={Keyboard.dismiss} size="compact" variant="tertiary">
              Done
            </AppButton>
          </View>
        </InputAccessoryView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  title: { ...Typography.screenTitle },
  intro: { ...Typography.body },
  card: { gap: Spacing.sm, padding: Spacing.md },
  confirmationCard: { gap: Spacing.md, padding: Spacing.md },
  cardTitle: { ...Typography.sectionTitle },
  copy: { ...Typography.body },
  input: {
    ...Typography.body,
    borderRadius: Radius.medium,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  keyboardToolbar: {
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
