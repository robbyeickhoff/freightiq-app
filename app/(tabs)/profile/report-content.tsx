import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  InputAccessoryView,
  Keyboard,
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

const reasons = [
  ["incorrect_or_unsafe", "Incorrect or unsafe"],
  ["private_or_confidential", "Private or confidential information"],
  ["abusive_or_inappropriate", "Abusive or inappropriate"],
  ["spam_or_unrelated", "Spam or unrelated"],
  ["other", "Other"],
] as const;

const operationsReasons = [
  ["outdated", "Outdated"],
  ["inaccurate", "Inaccurate"],
  ["duplicate", "Duplicate"],
  ["inappropriate", "Inappropriate"],
] as const;

const DETAILS_INPUT_ACCESSORY_ID = "report-details-keyboard-toolbar";

export default function ReportContentScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    subjectType?: "report" | "stop" | "operations_update";
    subjectId?: string;
    ownerId?: string;
    ownerName?: string;
  }>();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const detailsFieldYRef = useRef(0);

  const canBlock =
    (params.subjectType === "report" || params.subjectType === "operations_update") &&
    Boolean(params.ownerId);
  const availableReasons = params.subjectType === "operations_update" ? operationsReasons : reasons;

  async function blockContributor() {
    const { data } = await supabase.auth.getUser();
    if (!data.user || !params.ownerId) return;

    const { error } = await supabase.from("blocked_contributors").insert({
      blocking_user_id: data.user.id,
      blocked_user_id: params.ownerId,
    });

    if (error && error.code !== "23505") {
      Alert.alert("Unable to block contributor", error.message);
      return;
    }

    const hiddenContent =
      params.subjectType === "operations_update" ? "Operations updates" : "Driver Reports";
    Alert.alert("Contributor blocked", `Their ${hiddenContent} will be hidden for you.`, [
      { text: "Done", onPress: () => router.back() },
    ]);
  }

  async function submitReport() {
    if (!reason || !params.subjectType || !params.subjectId) return;
    setSubmitting(true);

    const payload = {
      subject_type: params.subjectType,
      report_id: params.subjectType === "report" ? params.subjectId : null,
      stop_id: params.subjectType === "stop" ? params.subjectId : null,
      operations_update_id: params.subjectType === "operations_update" ? params.subjectId : null,
      reason,
      details: details.trim() || null,
    };
    const { error } = await supabase.from("content_reports").insert(payload);
    setSubmitting(false);

    if (error) {
      const duplicate = error.code === "23505";
      Alert.alert(
        duplicate ? "Already reported" : "Unable to submit report",
        duplicate
          ? "You already have an open report for this content."
          : "Your report was not submitted. Please try again.",
      );
      return;
    }

    if (canBlock) {
      Alert.alert(
        "Report submitted",
        `FreightIQ will review it. Would you also like to block ${params.ownerName || "this contributor"}?`,
        [
          { text: "Not Now", onPress: () => router.back() },
          {
            text: "Block Contributor",
            style: "destructive",
            onPress: () => void blockContributor(),
          },
        ],
      );
      return;
    }

    Alert.alert("Report submitted", "FreightIQ will review it.", [
      { text: "Done", onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Select the reason that best describes the problem. Reporting does not immediately remove
          content for other drivers.
        </Text>

        <AppCard contentStyle={styles.card}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Reason</Text>
          {availableReasons.map(([value, label]) => (
            <AppButton
              key={value}
              accessibilityState={{ selected: reason === value }}
              onPress={() => setReason(value)}
              variant={reason === value ? "primary" : "secondary"}
            >
              {label}
            </AppButton>
          ))}
        </AppCard>

        <View
          onLayout={(event) => {
            detailsFieldYRef.current = event.nativeEvent.layout.y;
          }}
          style={styles.fieldGroup}
        >
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            Additional details (optional)
          </Text>
          <TextInput
            accessibilityLabel="Additional report details"
            accessibilityHint="Up to 500 characters"
            inputAccessoryViewID={Platform.OS === "ios" ? DETAILS_INPUT_ACCESSORY_ID : undefined}
            maxLength={500}
            multiline
            onChangeText={setDetails}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  animated: true,
                  y: Math.max(0, detailsFieldYRef.current - Spacing.sm),
                });
              }, 150);
            }}
            placeholder="Tell FreightIQ what is wrong or unsafe."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            textAlignVertical="top"
            value={details}
          />
          <Text style={[styles.counter, { color: colors.textSecondary }]}>
            {details.length}/500
          </Text>
        </View>

        <AppButton disabled={!reason} loading={submitting} onPress={() => void submitReport()}>
          Submit Report
        </AppButton>

        {canBlock ? (
          <AppButton onPress={() => void blockContributor()} variant="secondary">
            Block Contributor Without Reporting
          </AppButton>
        ) : null}
      </ScrollView>

      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={DETAILS_INPUT_ACCESSORY_ID}>
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
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  intro: { ...Typography.body },
  card: { gap: Spacing.sm, padding: Spacing.md },
  heading: { ...Typography.sectionTitle },
  fieldGroup: { gap: Spacing.xs },
  input: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    minHeight: 120,
    padding: Spacing.md,
    ...Typography.body,
  },
  counter: { ...Typography.supporting, textAlign: "right" },
  keyboardToolbar: {
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
