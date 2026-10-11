import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  ExamGroup,
  GenerateResponse,
  RoadmapSummary,
} from "../../../../types/roadmapTypes";
import RoadmapCard from "@/components/ui/RoadmapCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { confirmDelete } from "@/lib/confirm";
import { ApiError, apiJson, errorMessage } from "@/lib/api";
import { colors, radius, shadow } from "@/lib/theme";

type GroupSubject = ExamGroup["subjects"][number];

// Detected subjects that don't have a (still existing) roadmap yet
// (subjects is missing on backends deployed before it was added)
const pendingSubjects = (group: ExamGroup) =>
  (group.subjects ?? []).filter(
    (s) => !s.roadmapId || !group.roadmaps.some((r) => r.id === s.roadmapId),
  );

// Pending subjects grouped by their paper/semester, in document order
const bySubjectGroup = (subjects: GroupSubject[]) => {
  const map = new Map<string, GroupSubject[]>();
  for (const s of subjects) {
    const key = s.group ?? "";
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  return [...map.entries()];
};

// Combined progress of a group, recomputed so it stays right after deletes
const groupPercent = (roadmaps: RoadmapSummary[]) => {
  const total = roadmaps.reduce((n, r) => n + r.progress.totalTopics, 0);
  const done = roadmaps.reduce((n, r) => n + r.progress.completedTopics, 0);
  return total ? Math.round((done / total) * 100) : 0;
};

export default function AllRoadmap() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  // Roadmaps from multi-subject PDFs live in their exam group; the rest are ungrouped
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [ungrouped, setUngrouped] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Which groups show their not-created subjects, and which subjects are being created
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const updateRoadmaps = (
    update: (list: RoadmapSummary[]) => RoadmapSummary[],
  ) => {
    setGroups((prev) => prev.map((g) => ({ ...g, roadmaps: update(g.roadmaps) })));
    setUngrouped(update);
  };
  async function deleteRoadmap(roadmapId: string) {
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap/${roadmapId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie ?? "",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to delete Roadmap");
      }
      updateRoadmaps((list) => list.filter((roadmap) => roadmap.id !== roadmapId));
    } catch (error) {
      console.log("Error in deleting roadmap", error);
      Alert.alert("Couldn't delete roadmap", "Please try again.");
    }
  }
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function showALLRoadmap() {
      // Reloads after creating a subject refresh in place, without the full-screen spinner
      if (reloadKey === 0) setLoading(true);
      setError(null);

      try {
        const [groupData, listData] = await Promise.all([
          apiJson<{ examGroups: ExamGroup[] }>("/exam-groups"),
          apiJson<{ roadmap: RoadmapSummary[] }>("/roadmap?limit=100"),
        ]);

        if (!cancelled) {
          setGroups(groupData.examGroups ?? []);
          setUngrouped((listData.roadmap ?? []).filter((r) => !r.examGroupId));
        }
      } catch (error) {
        console.log("Error", error);

        if (!cancelled) {
          setError("Unable to load your roadmaps.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    showALLRoadmap();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  async function createSubject(group: ExamGroup, subject: GroupSubject) {
    const key = `${group.id}:${subject.index}`;
    if (!group.uploadId || creating[key]) return;
    setCreating((prev) => ({ ...prev, [key]: true }));
    try {
      await apiJson<GenerateResponse>(`/syllabus/${group.uploadId}/roadmaps`, {
        method: "POST",
        body: { subjectIndexes: [subject.index] },
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error("Error creating subject roadmap:", err);
      if (err instanceof ApiError && err.status === 410) {
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, canGenerate: false } : g)),
        );
        Alert.alert(
          "Upload expired",
          "Upload this PDF again from Create Roadmap. It's quick, and new roadmaps are added to this group.",
        );
      } else {
        Alert.alert(
          "Couldn't create roadmap",
          errorMessage(err, "Something went wrong. Please try again."),
        );
      }
    } finally {
      setCreating(({ [key]: _done, ...rest }) => rest);
    }
  }

  const toggleExpanded = (groupId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  async function toggleFollow(roadmapId: string, next: boolean) {
    const setFollowing = (value: boolean) =>
      updateRoadmaps((list) =>
        list.map((r) =>
          r.id === roadmapId ? { ...r, isFollowing: value } : r,
        ),
      );
    setFollowing(next);
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap/isfollowing/${roadmapId}`,
        {
          method: "PATCH",
          headers: { Cookie: cookie ?? "", "Content-Type": "application/json" },
          body: JSON.stringify({ isFollowing: next }),
        },
      );
      if (!response.ok) throw new Error("Failed to update follow status");
    } catch (error) {
      setFollowing(!next);
      Alert.alert("Couldn't update roadmap", "Please try again");
    }
  }

  const header = (subtitle?: string) => (
    <ScreenHeader
      title="Your Roadmaps"
      subtitle={subtitle}
      fallback="/(tabs)/(createroadmap)"
      right={
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(tabs)/(createroadmap)")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create roadmap"
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
          <Text style={styles.loadingText}>Loading your roadmaps...</Text>
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
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // A group stays visible while it has roadmaps or subjects left to create
  const visibleGroups = groups.filter(
    (g) => g.roadmaps.length > 0 || pendingSubjects(g).length > 0,
  );
  const allRoadmaps = [...visibleGroups.flatMap((g) => g.roadmaps), ...ungrouped];
  const totalCount = allRoadmaps.length;
  const followingCount = allRoadmaps.filter((r) => r.isFollowing).length;

  const renderCard = (roadmap: RoadmapSummary) => (
    <RoadmapCard
      key={roadmap.id}
      roadmap={roadmap}
      onToggleFollow={() => toggleFollow(roadmap.id, !roadmap.isFollowing)}
      onDelete={() =>
        confirmDelete(roadmap.name, () => deleteRoadmap(roadmap.id))
      }
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(createroadmap)/[id]",
          params: {
            id: roadmap.id,
          },
        })
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {header(
        totalCount > 0
          ? `${totalCount} roadmap${totalCount === 1 ? "" : "s"} · ${followingCount} following`
          : undefined,
      )}

      {/* Roadmap List */}
      {totalCount === 0 && visibleGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="book-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No roadmaps yet</Text>
          <Text style={styles.emptyText}>
            Create your first roadmap and start your learning journey.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(tabs)/(createroadmap)")}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Create Roadmap</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {totalCount > 0 && followingCount === 0 && (
            <View style={styles.tipBanner}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
              <Text style={styles.tipText}>
                Tap <Text style={styles.tipBold}>Follow</Text> on a roadmap to pin
                it to your Home screen.
              </Text>
            </View>
          )}

          {visibleGroups.map((group) => {
            const pending = pendingSubjects(group);
            const open = !!expanded[group.id];
            const subjectCount = group.subjects?.length ?? 0;
            const createdCount = subjectCount - pending.length;

            return (
              <View key={group.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="layers" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle} numberOfLines={2}>
                      {group.name}
                    </Text>
                    <Text style={styles.sectionMeta}>
                      {subjectCount > 0
                        ? `${createdCount} of ${subjectCount} subjects created`
                        : `${group.roadmaps.length} subject${group.roadmaps.length === 1 ? "" : "s"}`}
                      {group.roadmaps.length > 0 &&
                        ` · ${groupPercent(group.roadmaps)}% complete`}
                    </Text>
                  </View>
                </View>

                {group.roadmaps.map(renderCard)}

                {pending.length > 0 && (
                  <View style={styles.pendingCard}>
                    <TouchableOpacity
                      style={styles.pendingToggle}
                      onPress={() => toggleExpanded(group.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pendingIcon}>
                        <Ionicons name="add" size={18} color={colors.primary} />
                      </View>
                      <Text style={styles.pendingToggleText}>
                        {pending.length} subject{pending.length === 1 ? "" : "s"} not
                        created yet
                      </Text>
                      <Ionicons
                        name={open ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>

                    {open && !group.canGenerate && (
                      <View style={styles.expiredBox}>
                        <Text style={styles.expiredText}>
                          This PDF's upload has expired. Upload the same PDF again
                          to create these. It's quick, and they'll be added here.
                        </Text>
                        <TouchableOpacity
                          onPress={() => router.push("/(tabs)/(createroadmap)")}
                          hitSlop={8}
                        >
                          <Text style={styles.expiredLink}>Upload PDF again</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {open &&
                      bySubjectGroup(pending).map(([subjectGroup, subjects]) => (
                        <View key={subjectGroup || "__none"} style={styles.pendingGroup}>
                          {subjectGroup ? (
                            <Text style={styles.pendingGroupTitle}>{subjectGroup}</Text>
                          ) : null}
                          {subjects.map((subject) => {
                            const busy = !!creating[`${group.id}:${subject.index}`];
                            return (
                              <View key={subject.index} style={styles.pendingRow}>
                                <Text style={styles.pendingName}>{subject.name}</Text>
                                {group.canGenerate &&
                                  (busy ? (
                                    <View style={styles.createBtn}>
                                      <ActivityIndicator size="small" color={colors.white} />
                                    </View>
                                  ) : (
                                    <TouchableOpacity
                                      style={styles.createBtn}
                                      onPress={() => createSubject(group, subject)}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.createBtnText}>Create</Text>
                                    </TouchableOpacity>
                                  ))}
                              </View>
                            );
                          })}
                        </View>
                      ))}
                  </View>
                )}
              </View>
            );
          })}

          {ungrouped.length > 0 && (
            <View style={styles.section}>
              {visibleGroups.length > 0 && (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="book" size={17} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Other roadmaps</Text>
                </View>
              )}
              {ungrouped.map(renderCard)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },

  content: {
    paddingBottom: 32,
  },

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

  section: {
    marginBottom: 14,
  },

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

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },

  sectionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  pendingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BFE6D6",
    marginBottom: 12,
    overflow: "hidden",
  },

  pendingToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

  pendingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  pendingGroup: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  pendingGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 4,
  },

  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  pendingName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },

  createBtn: {
    minWidth: 72,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  createBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  expiredBox: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.warningTint,
  },

  expiredText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#7A5A00",
  },

  expiredLink: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },

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

  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

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

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
    marginTop: 18,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 12,
  },
});
