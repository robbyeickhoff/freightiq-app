import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { supabase } from "@/utils/supabase";

type BlockedContributor = {
  id: string;
  username: string;
  tractorType: string | null;
};

export default function BlockedContributorsScreen() {
  const { colors } = useAppTheme();
  const [contributors, setContributors] = useState<BlockedContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadContributors = useCallback(async () => {
    setLoading(true);
    const { data: blocks, error } = await supabase
      .from("blocked_contributors")
      .select("blocked_user_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      Alert.alert("Unable to load blocked contributors", error.message);
      return;
    }

    const ids = (blocks ?? []).map((block) => block.blocked_user_id);
    if (!ids.length) {
      setContributors([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, tractor_type")
      .in("id", ids);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    setContributors(
      ids.map((id) => ({
        id,
        username: profileMap.get(id)?.username?.trim() || "FreightIQ contributor",
        tractorType: profileMap.get(id)?.tractor_type ?? null,
      })),
    );
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadContributors();
    }, [loadContributors]),
  );

  async function unblock(contributor: BlockedContributor) {
    setUnblockingId(contributor.id);
    const { error } = await supabase
      .from("blocked_contributors")
      .delete()
      .eq("blocked_user_id", contributor.id);
    setUnblockingId(null);

    if (error) {
      Alert.alert("Unable to unblock contributor", error.message);
      return;
    }

    setContributors((current) => current.filter((item) => item.id !== contributor.id));
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Reports from blocked contributors are hidden for you. Neutral stop details and shared Core
          Intel remain available. Contributors are not notified when you block or unblock them.
        </Text>

        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading…</Text>
        ) : contributors.length === 0 ? (
          <AppCard contentStyle={styles.emptyCard}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              No blocked contributors
            </Text>
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              You can block another contributor from the actions beneath their Driver Report.
            </Text>
          </AppCard>
        ) : (
          contributors.map((contributor) => (
            <AppCard key={contributor.id} contentStyle={styles.card}>
              <View style={styles.copy}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {contributor.username}
                </Text>
                {contributor.tractorType ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {contributor.tractorType}
                  </Text>
                ) : null}
              </View>
              <AppButton
                accessibilityHint={`Restores Driver Reports from ${contributor.username}`}
                loading={unblockingId === contributor.id}
                onPress={() => void unblock(contributor)}
                size="compact"
                variant="secondary"
              >
                Unblock
              </AppButton>
            </AppCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  intro: { ...Typography.body },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  copy: { flex: 1 },
  cardTitle: { ...Typography.sectionTitle },
  meta: { ...Typography.supporting, marginTop: Spacing.xs },
  emptyCard: { gap: Spacing.xs, padding: Spacing.lg },
  empty: { ...Typography.body },
});
