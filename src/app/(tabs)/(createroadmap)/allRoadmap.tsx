import { apiJson } from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { RoadmapSummary, Space } from "../../../../types/roadmapTypes";
import RoadmapCard from "@/components/ui/RoadmapCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { confirmDelete } from "@/lib/confirm";
import { colors, radius, shadow } from "@/lib/theme";

// Every roadmap the user has, grouped by space, to follow or unfollow them
export default function AllRoadmap() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [spaceData, listData] = await Promise.all([
        apiJson<{ spaces: Space[] }>("/spaces"),
        apiJson<{ roadmap: RoadmapSummary[] }>("/roadmap?limit=100"),
      ]);
      setSpaces(spaceData.spaces ?? []);
      setRoadmaps(listData.roadmap ?? []);
    } catch (err) {
      console.log("Error", err);
      setError("Unable to load your roadmaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function deleteRoadmap(roadmapId: string) {
    try {
      await apiJson(`/roadmap/${roadmapId}`, { method: "DELETE" });
      setRoadmaps((list) => list.filter((r) => r.id !== roadmapId));
    } catch (err) {
      console.log("Error in deleting roadmap", err);
      Alert.alert("Couldn't delete roadmap", "Please try again.");
    }
  }

  async function toggleFollow(roadmapId: string, next: boolean) {
    const setFollowing = (value: boolean) =>
      setRoadmaps((list) =>
        list.map((r) => (r.id === roadmapId ? { ...r, isFollowing: value } : r)),
      );
    setFollowing(next);
    try {
      await apiJson(`/roadmap/isfollowing/${roadmapId}`, {
        method: "PATCH",
        body: { isFollowing: next },
      });
    } catch {
      setFollowing(!next);
      Alert.alert("Couldn't update roadmap", "Please try again");
    }
  }

  const goToSpaces = () => router.push("/(tabs)/(createroadmap)");

  const header = (subtitle?: string) => (
    <ScreenHeader
      title="All Roadmaps"
      subtitle={subtitle}
      fallback="/(tabs)/(createroadmap)"
      right={
        <TouchableOpacity
          style={styles.addBtn}
          onPress={goToSpaces}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add roadmap"
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      }
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {header()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.mutedText}>Loading your roadmaps...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {header()}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.mutedText}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setLoading(true);
              load();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const followingCount = roadmaps.filter((r) => r.isFollowing).length;
  // Spaces in the server's order, each with its roadmaps; empty spaces are left out
  const sections = spaces
    .map((space) => ({ space, items: roadmaps.filter((r) => r.spaceId === space.id) }))
    .filter((s) => s.items.length > 0);

  const renderCard = (roadmap: RoadmapSummary) => (
    <RoadmapCard
      key={roadmap.id}
      roadmap={roadmap}
      onToggleFollow={() => toggleFollow(roadmap.id, !roadmap.isFollowing)}
      onDelete={() => confirmDelete(roadmap.name, () => deleteRoadmap(roadmap.id))}
      onPress={() =>
        router.push({ pathname: "/(tabs)/(createroadmap)/[id]", params: { id: roadmap.id } })
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {header(
        roadmaps.length > 0
          ? `${roadmaps.length} roadmap${roadmaps.length === 1 ? "" : "s"} · ${followingCount} following`
          : undefined,
      )}

      {roadmaps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="book-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No roadmaps yet</Text>
          <Text style={styles.emptyText}>
            Open a space and add roadmaps for the subjects you're studying.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={goToSpaces} activeOpacity={0.85}>
            <Ionicons name="layers-outline" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Go to Spaces</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {followingCount === 0 && (
            <View style={styles.tipBanner}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
              <Text style={styles.tipText}>
                Tap <Text style={styles.tipBold}>Follow</Text> on a roadmap to pin it to your
                Home screen.
              </Text>
            </View>
          )}

          {sections.map(({ space, items }) => (
            <View key={space.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(createroadmap)/space/[spaceId]",
                    params: { spaceId: space.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.sectionIcon}>
                  <Ionicons name="layers" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle} numberOfLines={2}>
                    {space.name}
                  </Text>
                  <Text style={styles.sectionMeta}>
                    {items.length} roadmap{items.length === 1 ? "" : "s"} ·{" "}
                    {space.progress.percent}% complete
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {items.map(renderCard)}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  mutedText: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },

  content: { paddingBottom: 32 },

  tipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  tipBold: { fontWeight: "800" },

  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  sectionMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadow.raised,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 21, fontWeight: "800", color: colors.text, marginTop: 18 },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 12,
  },
});
