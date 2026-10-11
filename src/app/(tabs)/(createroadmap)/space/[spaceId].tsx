import { apiJson, errorMessage } from "@/lib/api";
import { confirmDelete } from "@/lib/confirm";
import { colors, radius, shadow } from "@/lib/theme";
import NameModal from "@/components/ui/NameModal";
import ProgressRing from "@/components/ui/ProgressRing";
import RoadmapCard from "@/components/ui/RoadmapCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RoadmapSummary, SpaceDetail, SpaceUpload } from "../../../../../types/roadmapTypes";

// One space: its roadmaps, and the PDFs in it that more subjects can be picked from
export default function SpaceScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const router = useRouter();
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<{ space: SpaceDetail }>(`/spaces/${spaceId}`);
      setSpace(data.space);
    } catch (err) {
      console.error("Error loading space:", err);
      setError(errorMessage(err, "Couldn't load this space."));
    } finally {
      setRefreshing(false);
    }
  }, [spaceId]);

  // Reload on focus so roadmaps created or ticked off elsewhere show up
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const updateRoadmaps = (update: (list: RoadmapSummary[]) => RoadmapSummary[]) =>
    setSpace((prev) => (prev ? { ...prev, roadmaps: update(prev.roadmaps) } : prev));

  const toggleFollow = async (roadmap: RoadmapSummary) => {
    const next = !roadmap.isFollowing;
    const setFollowing = (value: boolean) =>
      updateRoadmaps((list) =>
        list.map((r) => (r.id === roadmap.id ? { ...r, isFollowing: value } : r)),
      );
    setFollowing(next);
    try {
      await apiJson(`/roadmap/isfollowing/${roadmap.id}`, {
        method: "PATCH",
        body: { isFollowing: next },
      });
    } catch {
      setFollowing(!next);
      Alert.alert("Couldn't update roadmap", "Please try again.");
    }
  };

  const deleteRoadmap = async (roadmapId: string) => {
    try {
      await apiJson(`/roadmap/${roadmapId}`, { method: "DELETE" });
      // Reload so the PDF's subject list shows the subject as available again
      load();
    } catch {
      Alert.alert("Couldn't delete roadmap", "Please try again.");
    }
  };

  const renameSpace = async (name: string) => {
    try {
      await apiJson(`/spaces/${spaceId}`, { method: "PATCH", body: { name } });
      setSpace((prev) => (prev ? { ...prev, name } : prev));
      setRenaming(false);
    } catch (err) {
      Alert.alert("Couldn't rename space", errorMessage(err, "Please try again."));
    }
  };

  const deleteSpace = () => {
    if (!space) return;
    const count = space.roadmaps.length;
    Alert.alert(
      "Delete space",
      count > 0
        ? `Delete "${space.name}" and its ${count} roadmap${count === 1 ? "" : "s"}? This cannot be undone.`
        : `Delete "${space.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiJson(`/spaces/${spaceId}`, { method: "DELETE" });
              router.back();
            } catch (err) {
              Alert.alert("Couldn't delete space", errorMessage(err, "Please try again."));
            }
          },
        },
      ],
    );
  };

  const openMenu = () =>
    Alert.alert(space?.name ?? "Space", undefined, [
      { text: "Rename space", onPress: () => setRenaming(true) },
      { text: "Delete space", style: "destructive", onPress: deleteSpace },
      { text: "Cancel", style: "cancel" },
    ]);

  const addRoadmap = (uploadId?: string) =>
    router.push({
      pathname: "/(tabs)/(createroadmap)/create",
      params: uploadId ? { spaceId, uploadId } : { spaceId },
    });

  const openRoadmap = (id: string) =>
    router.push({ pathname: "/(tabs)/(createroadmap)/[id]", params: { id } });

  const header = (
    <ScreenHeader
      title={space?.name ?? "Space"}
      subtitle={
        space
          ? `${space.roadmaps.length} roadmap${space.roadmaps.length === 1 ? "" : "s"}`
          : undefined
      }
      fallback="/(tabs)/(createroadmap)"
      right={
        space ? (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={openMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Space options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
        ) : null
      }
    />
  );

  if (!space) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          {error ? (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
              <Text style={styles.mutedText}>{error}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={load} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Try again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // PDFs that still have subjects to pick (and can still be generated from)
  const pickablePdfs = space.uploads.filter(
    (u) => u.canGenerate && u.subjects.some((s) => !s.roadmapId),
  );

  return (
    <SafeAreaView style={styles.container}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {space.roadmaps.length > 0 && (
          <View style={styles.summary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>SPACE PROGRESS</Text>
              <Text style={styles.summaryTitle}>
                {space.progress.completedTopics} of {space.progress.totalTopics} topics
              </Text>
              <Text style={styles.summarySub}>
                across {space.roadmaps.length} roadmap{space.roadmaps.length === 1 ? "" : "s"}
              </Text>
            </View>
            <ProgressRing percent={space.progress.percent} size={68} stroke={7} inverted />
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, styles.addBtn]}
          onPress={() => addRoadmap()}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
          <Text style={styles.primaryBtnText}>Add roadmap from a PDF</Text>
        </TouchableOpacity>

        {pickablePdfs.map((upload) => (
          <PdfRow key={upload.id} upload={upload} onPress={() => addRoadmap(upload.id)} />
        ))}

        {space.roadmaps.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="map-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No roadmaps here yet</Text>
            <Text style={styles.emptyText}>
              Upload your syllabus PDF and pick the subjects you're studying. Only those get a
              roadmap.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Roadmaps</Text>
            {space.roadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                onPress={() => openRoadmap(roadmap.id)}
                onToggleFollow={() => toggleFollow(roadmap)}
                onDelete={() => confirmDelete(roadmap.name, () => deleteRoadmap(roadmap.id))}
              />
            ))}
          </>
        )}
      </ScrollView>

      <NameModal
        visible={renaming}
        title="Rename space"
        initialValue={space.name}
        submitLabel="Save"
        onSubmit={renameSpace}
        onClose={() => setRenaming(false)}
      />
    </SafeAreaView>
  );
}

function PdfRow({ upload, onPress }: { upload: SpaceUpload; onPress: () => void }) {
  const added = upload.subjects.filter((s) => s.roadmapId).length;
  const name =
    upload.fileName?.replace(/\.pdf$/i, "") ?? upload.examOrBoard ?? "Syllabus PDF";
  return (
    <TouchableOpacity style={styles.pdfRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.pdfIcon}>
        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pdfTitle} numberOfLines={1}>
          Pick more subjects from {name}
        </Text>
        <Text style={styles.pdfMeta}>
          {added > 0 ? `${added} added so far · ` : ""}no need to upload again
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  mutedText: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  content: { paddingBottom: 32 },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    marginBottom: 16,
    ...shadow.raised,
  },
  summaryLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: "#9FE0C6" },
  summaryTitle: { marginTop: 6, fontSize: 19, fontWeight: "800", color: colors.white },
  summarySub: { marginTop: 2, fontSize: 13, color: "#CFEDE1" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadow.raised,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },
  addBtn: { marginBottom: 12 },

  pdfRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  pdfMeta: { marginTop: 2, fontSize: 12, color: colors.textSecondary },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
    marginBottom: 12,
  },

  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 16 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: colors.text },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
