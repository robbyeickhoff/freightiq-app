import { useEffect, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { supabase } from "@/utils/supabase";

type ReferralProgress = {
  referral_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referrer_username: string;
  referred_username: string | null;
  status: string;
  active_days: number;
  active_days_target: number;
  qualifying_stops: number;
  qualifying_stops_target: number;
  referrer_reward_status: string | null;
  referred_reward_status: string | null;
};

function statusLabel(status: string) {
  if (status === "qualified") return "Qualified";
  if (status === "expired") return "Window complete";
  if (status === "pending") return "Waiting for account verification";
  return "In progress";
}

export default function ReferADriverScreen() {
  const { colors } = useAppTheme();
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<ReferralProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const referralUrl = code ? `https://freightiqapp.com/join/${code}` : "";

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const [profileResult, progressResult] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", auth.user.id).single(),
        supabase.rpc("get_referral_progress"),
      ]);
      if (profileResult.error || progressResult.error) {
        Alert.alert("Unable to load referrals", "Try again in a moment.");
      } else {
        setCode(profileResult.data.referral_code ?? "");
        setReferrals((progressResult.data ?? []) as ReferralProgress[]);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function shareReferral() {
    if (!referralUrl) return;
    await Share.share({
      message: `Join me on FreightIQ. Use my referral link: ${referralUrl}\n\nComplete 5 active days and 5 qualifying stops within 30 days and we each earn $5.`,
      url: referralUrl,
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>FreightIQ Programs</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Refer a Driver</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Invite a new driver. When they complete 5 active days and 5 qualifying stops within 30 days,
        you each earn $5.
      </Text>

      <AppCard contentStyle={styles.qrCard}>
        {code ? (
          <>
            <View style={styles.qrSurface}>
              <QRCode value={referralUrl} size={210} backgroundColor="#ffffff" color="#090c0f" />
            </View>
            <Text style={[styles.scanLabel, { color: colors.textPrimary }]}>Have another driver scan your code</Text>
            <Text selectable style={[styles.code, { color: colors.accentStrong }]}>{code}</Text>
            <AppButton fullWidth onPress={() => void shareReferral()}>Share Referral Link</AppButton>
          </>
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {loading ? "Loading your referral code…" : "Your referral code is not available yet."}
          </Text>
        )}
      </AppCard>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Your referrals</Text>
      {referrals.length ? referrals.map((referral) => {
        const isReferrer = referral.referrer_user_id === userId;
        const name = isReferrer ? (referral.referred_username ?? "New driver") : referral.referrer_username;
        const rewardStatus = isReferrer ? referral.referrer_reward_status : referral.referred_reward_status;
        return (
          <AppCard key={referral.referral_id} contentStyle={styles.referralCard}>
            <View style={styles.row}>
              <Text style={[styles.driverName, { color: colors.textPrimary }]}>{name}</Text>
              <Text style={[styles.status, { color: colors.accentStrong }]}>{statusLabel(referral.status)}</Text>
            </View>
            <Text style={[styles.progress, { color: colors.textSecondary }]}>
              {referral.active_days}/5 active days · {referral.qualifying_stops}/5 qualifying stops
            </Text>
            {rewardStatus ? (
              <Text style={[styles.reward, { color: colors.textPrimary }]}>
                $5 {rewardStatus === "paid" ? "paid" : "earned"}
              </Text>
            ) : null}
          </AppCard>
        );
      }) : (
        <AppCard contentStyle={styles.referralCard}>
          <Text style={[styles.body, { color: colors.textSecondary }]}>No referrals yet. Share your link when you meet another driver who could use FreightIQ.</Text>
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  eyebrow: { ...Typography.operationalLabel, fontWeight: "700", textTransform: "uppercase" },
  title: { ...Typography.screenTitle, marginTop: Spacing.xs },
  body: { ...Typography.body, marginTop: Spacing.sm },
  qrCard: { alignItems: "center", gap: Spacing.md, marginTop: Spacing.lg, padding: Spacing.lg },
  qrSurface: { backgroundColor: "#ffffff", borderRadius: 18, padding: 16 },
  scanLabel: { ...Typography.body, fontWeight: "700", textAlign: "center" },
  code: { ...Typography.screenTitle, letterSpacing: 4 },
  sectionLabel: { ...Typography.operationalLabel, marginBottom: Spacing.xs, marginLeft: Spacing.xs, marginTop: Spacing.lg, textTransform: "uppercase" },
  referralCard: { gap: Spacing.sm, marginBottom: Spacing.sm, padding: Spacing.md },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm },
  driverName: { ...Typography.body, fontWeight: "700" },
  status: { ...Typography.supporting, fontWeight: "700" },
  progress: { ...Typography.supporting },
  reward: { ...Typography.body, fontWeight: "700" },
});
