import { authClient } from "@/lib/auth-client";
import { colors, radius, shadow } from "@/lib/theme";
import ProgressRing from "@/components/ui/ProgressRing";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RoadmapSummary } from "../../../types/roadmapTypes";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function Index() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const firstName = session?.user.name?.trim().split(/\s+/)[0];
  const router = useRouter();

  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  // Whether the user has created any roadmap at all (followed or not)
  const [hasAnyRoadmap, setHasAnyRoadmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getRoadmap = useCallback(async () => {
    setError(null);
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap/isfollowing`,
        {
          method: "GET",
          headers: { Cookie: cookie ?? "" },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch roadmaps");
      }

      const data = await response.json();
      const following: RoadmapSummary[] = data.roadmaps ?? [];
      setRoadmaps(following);

      // Not following anything: check if there are roadmaps they could follow
      if (following.length === 0) {
        const allResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap?limit=1`,
          {
            method: "GET",
            headers: { Cookie: cookie ?? "" },
          },
        );
        if (!allResponse.ok) {
          throw new Error("Failed to fetch roadmaps");
        }
        const allData = await allResponse.json();
        setHasAnyRoadmap((allData.roadmap ?? []).length > 0);
      } else {
        setHasAnyRoadmap(true);
      }
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      setError("Couldn't load your roadmaps.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Refetch every time Home comes into view, so follow changes made elsewhere show up
  useFocusEffect(
    useCallback(() => {
      getRoadmap();
    }, [getRoadmap]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    getRoadmap();
  };

  const openRoadmap = (id: string) => {
    router.push({
      pathname: "/(tabs)/(createroadmap)/[id]",
      params: { id },
    });
  };

  const createRoadmap = () => {
    router.push("/(tabs)/(createroadmap)");
  };

  const browseRoadmaps = () => {
    router.push("/(tabs)/(createroadmap)/allRoadmap");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your roadmaps...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.loadingText}>{error}</Text>
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 18 }]}
          onPress={() => {
            setLoading(true);
            getRoadmap();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Overall progress across every followed roadmap
  const totalTopics = roadmaps.reduce((n, r) => n + r.progress.totalTopics, 0);
  const doneTopics = roadmaps.reduce((n, r) => n + r.progress.completedTopics, 0);
  const overall = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const greetingBlock = (
    <View style={styles.greeting}>
      <Text style={styles.greetingTitle}>
        {greeting()}
        {firstName ? `, ${firstName}` : ""} 👋
      </Text>
      <Text style={styles.greetingSub}>
        {roadmaps.length > 0
          ? "Pick up where you left off."
          : "Let's get your study plan going."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {roadmaps.length > 0 ? (
        <FlatList
          data={roadmaps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {greetingBlock}

              {/* Overall progress */}
              <View style={styles.summary}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>OVERALL PROGRESS</Text>
                  <Text style={styles.summaryTitle}>
                    {doneTopics} of {totalTopics} topics
                  </Text>
                  <Text style={styles.summarySub}>
                    across {roadmaps.length} roadmap
                    {roadmaps.length > 1 ? "s" : ""} you follow
                  </Text>
                </View>
                <ProgressRing percent={overall} size={72} stroke={8} inverted />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Continue learning</Text>
                <TouchableOpacity onPress={browseRoadmaps} hitSlop={8}>
                  <Text style={styles.linkText}>See all</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const p = item.progress;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openRoadmap(item.id)}
              >
                <ProgressRing percent={p.percent} size={52} stroke={5} />

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardHint} numberOfLines={1}>
                    {p.percent === 100
                      ? "Completed 🎉"
                      : `${p.completedTopics} of ${p.totalTopics} topics done`}
                  </Text>
                </View>

                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.createCard}
              onPress={createRoadmap}
              activeOpacity={0.85}
            >
              <View style={styles.createIcon}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createTitle}>Create Roadmap</Text>
                <Text style={styles.createSub}>Upload a syllabus PDF</Text>
              </View>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.emptyWrap}>
          {greetingBlock}
          {hasAnyRoadmap ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bookmark-outline" size={44} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Not following any roadmap</Text>
              <Text style={styles.emptyText}>
                Follow a roadmap to see it here and pick up where you left off.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={browseRoadmaps}
                activeOpacity={0.85}
              >
                <Ionicons name="map-outline" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Follow a Roadmap</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createRoadmap} hitSlop={8}>
                <Text style={styles.secondaryLink}>or create a new one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="map-outline" size={44} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No roadmap yet</Text>
              <Text style={styles.emptyText}>
                Upload your syllabus and we'll break it into topics and subtopics
                you can study one at a time.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={createRoadmap}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Create Roadmap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Greeting
  greeting: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  greetingSub: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Summary
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    ...shadow.raised,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#9FE0C6",
  },
  summaryTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },
  summarySub: {
    marginTop: 2,
    fontSize: 13,
    color: "#CFEDE1",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  linkText: { fontSize: 14, fontWeight: "700", color: colors.primary },

  // List
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },

  createCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 4,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A9D9C5",
    backgroundColor: colors.primarySoft,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  createTitle: { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
  createSub: { marginTop: 2, fontSize: 12, color: colors.textSecondary },

  // Empty state
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 26,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: radius.md,
    gap: 8,
    ...shadow.raised,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryLink: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});
