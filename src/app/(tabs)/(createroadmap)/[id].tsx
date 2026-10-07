import { authClient } from "@/lib/auth-client";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Roadmap } from "../../../../types/roadmapTypes";
import RoadmapView from "@/components/roadmap/RoadmapViw";

export default function RoadmapDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  useEffect(() => {
    (async () => {
      const cookie = await authClient.getCookie();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/roadmap/${id}`,
        { method: "GET", headers: { Cookie: cookie ?? "" } },
      );
      const data = await res.json();
      setRoadmap(data.roadmap);
    })();
  }, [id]);

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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete unit");
      }
      console.log("deleted SUccessfully", data);

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

  const deleteTopic = async (
    unitId: string,
    topicId: string,
    // subTopicId: string,
  ) => {
    try {
      // console.log("subTopicId", subTopicId);
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete");
      }
      console.log("deleted successfully", data);

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

      const data = await response.json();
      console.log("deleted", data);
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete subtopic");
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
  if (!roadmap) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#16A673" />
      </View>
    );
  }

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
              return {
                ...t,
                completed: value!,
                subTopics: t.subTopics.map((s) => ({
                  ...s,
                  completed: value!,
                })),
              };
            }),
          };
        }),
      };
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <RoadmapView
          roadmap={roadmap}
          onToggleUnit={(unitId) => {
            const unit = roadmap.units.find((u) => u.id === unitId)!;
            const next = !(
              unit.topics.length > 0 &&
              unit.topics.every((t) =>
                t.subTopics.length
                  ? t.subTopics.every((s) => s.completed)
                  : t.completed,
              )
            );
            setDone(unitId, null, null, next);
            // TODO: PATCH /api/unit/:unitId/complete { completed: next }
          }}
          onToggleTopic={(unitId, topicId) => {
            const t = roadmap.units
              .find((u) => u.id === unitId)!
              .topics.find((x) => x.id === topicId)!;
            const next = !(t.subTopics.length
              ? t.subTopics.every((s) => s.completed)
              : t.completed);
            setDone(unitId, topicId, null, next);
            // TODO: PATCH /api/topic/:topicId { completed: next }
          }}
          onToggleSubTopic={(unitId, topicId, subId) => {
            setDone(unitId, topicId, subId);
            // TODO: PATCH /api/subtopic/:subId { completed: !current }
          }}
          onDeleteUnit={deleteUnit}
          onDeleteTopic={deleteTopic}
          onDeleteSubTopic={deleteSubTopic}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
