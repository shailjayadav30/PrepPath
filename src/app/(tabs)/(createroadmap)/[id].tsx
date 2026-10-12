import { authClient } from "@/lib/auth-client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Roadmap } from "../../../../types/roadmapTypes";
import RoadmapView from "@/components/roadmap/RoadmapViw";
import StudyTimer from "@/components/study/StudyTimer";
import { useStudySession } from "@/components/study/StudySessionProvider";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors, radius } from "@/lib/theme";

export default function RoadmapDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Shared study session: refreshed after each tick so its counts and marks stay current
  const { session: studySession, refresh: refreshSession } = useStudySession();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRoadmap(null);
    (async () => {
      try {
        const cookie = await authClient.getCookie();
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap/${id}`,
          { method: "GET", headers: { Cookie: cookie ?? "" } },
        );
        if (!res.ok) {
          throw new Error(`Failed to load roadmap (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setRoadmap(data.roadmap);
      } catch (error) {
        console.error("Failed to load roadmap:", error);
        if (!cancelled) setError("Couldn't load this roadmap.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const deleteUnit = async (unitId: string) => {
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/units/${unitId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie ?? "",
          },
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete unit");
      }

      setRoadmap((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          units: prev.units.filter((unit) => unit.id !== unitId),
        };
      });
    } catch (error) {
      console.error("Failed to delete unit:", error);
      Alert.alert("Error", "Failed to delete unit. Please try again.");
    }
  };

  const deleteTopic = async (unitId: string, topicId: string) => {
    try {
      const cookie = await authClient.getCookie();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/topics/${topicId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie ?? "",
          },
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete topic");
      }

      setRoadmap((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          units: prev.units.map((unit) =>
            unit.id !== unitId
              ? unit
              : {
                  ...unit,
                  topics: unit.topics.filter((topic) => topic.id !== topicId),
                },
          ),
        };
      });
    } catch (error) {
      console.error("Failed to delete topic:", error);
      Alert.alert("Error", "Failed to delete topic. Please try again.");
    }
  };

  const deleteSubTopic = async (
    unitId: string,
    topicId: string,
    subTopicId: string,
  ) => {
    try {
      const cookie = await authClient.getCookie();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/subTopics/${subTopicId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie ?? "",
          },
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete subtopic");
      }
      setRoadmap((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          units: prev.units.map((unit) =>
            unit.id !== unitId
              ? unit
              : {
                  ...unit,
                  topics: unit.topics.map((topic) =>
                    topic.id !== topicId
                      ? topic
                      : {
                          ...topic,
                          subTopics: topic.subTopics.filter(
                            (subTopic) => subTopic.id !== subTopicId,
                          ),
                        },
                  ),
                },
          ),
        };
      });
    } catch (error) {
      console.error("Failed to delete subtopic:", error);
      Alert.alert("Error", "Failed to delete subtopic. Please try again.");
    }
  };

  // Completion is applied locally first; on failure restore the state from before the toggle
  const saveCompletion = async (
    path: string,
    completed: boolean,
    snapshot: Roadmap,
  ) => {
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/${path}/complete`,
        {
          method: "PATCH",
          headers: { Cookie: cookie ?? "", "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update progress (${response.status})`);
      }
      refreshSession();
    } catch (error) {
      console.error("Failed to update progress:", error);
      setRoadmap(snapshot);
      Alert.alert("Error", "Couldn't save your progress. Please try again.");
    }
  };

  const viewPdf = (uploadId: string) =>
    router.push({ pathname: "/(tabs)/(createroadmap)/pdf", params: { uploadId } });

  const header = (
    <ScreenHeader title="Roadmap" fallback="/(tabs)/(createroadmap)/allRoadmap" />
  );

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        {header}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setReloadKey((k) => k + 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!roadmap) {
    return (
      <SafeAreaView style={styles.screen}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading roadmap...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Items ticked during the open session, when it's on this roadmap
  const session = studySession?.roadmapId === roadmap.id ? studySession : null;
  const sessionItemIds = session
    ? new Set([...session.topicIds, ...session.subTopicIds])
    : undefined;

  const setDone = (
    unitId: string,
    topicId: string | null,
    subId: string | null,
    value?: boolean,
  ) => {
    setRoadmap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => {
          if (u.id !== unitId) return u;
          return {
            ...u,
            topics: u.topics.map((t) => {
              if (topicId && t.id !== topicId) return t;

              // subtopic toggle
              if (subId) {
                const subTopics = t.subTopics.map((s) =>
                  s.id === subId ? { ...s, completed: !s.completed } : s,
                );
                return {
                  ...t,
                  subTopics,
                  completed: subTopics.every((s) => s.completed),
                };
              }

              // topic or unit toggle: set topic and all its subtopics
              const completed = value ?? false;
              return {
                ...t,
                completed,
                subTopics: t.subTopics.map((s) => ({ ...s, completed })),
              };
            }),
          };
        }),
      };
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {header}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StudyTimer roadmapId={roadmap.id} />
        <RoadmapView
          roadmap={roadmap}
          sessionItemIds={sessionItemIds}
          onToggleUnit={(unitId) => {
            const unit = roadmap.units.find((u) => u.id === unitId);
            if (!unit) return;
            const next = !(
              unit.topics.length > 0 &&
              unit.topics.every((t) =>
                t.subTopics.length
                  ? t.subTopics.every((s) => s.completed)
                  : t.completed,
              )
            );
            setDone(unitId, null, null, next);
            saveCompletion(`units/${unitId}`, next, roadmap);
          }}
          onToggleTopic={(unitId, topicId) => {
            const t = roadmap.units
              .find((u) => u.id === unitId)
              ?.topics.find((x) => x.id === topicId);
            if (!t) return;
            const next = !(t.subTopics.length
              ? t.subTopics.every((s) => s.completed)
              : t.completed);
            setDone(unitId, topicId, null, next);
            saveCompletion(`topics/${topicId}`, next, roadmap);
          }}
          onToggleSubTopic={(unitId, topicId, subId) => {
            const sub = roadmap.units
              .find((u) => u.id === unitId)
              ?.topics.find((t) => t.id === topicId)
              ?.subTopics.find((s) => s.id === subId);
            if (!sub) return;
            setDone(unitId, topicId, subId);
            saveCompletion(`subTopics/${subId}`, !sub.completed, roadmap);
          }}
          {...(roadmap.uploadId && {
            onViewPdf: () => viewPdf(roadmap.uploadId!),
          })}
          onDeleteUnit={deleteUnit}
          onDeleteTopic={deleteTopic}
          onDeleteSubTopic={deleteSubTopic}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  scroll: { paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  errorText: { fontSize: 15, color: colors.textSecondary },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.white, fontWeight: "700" },
});
