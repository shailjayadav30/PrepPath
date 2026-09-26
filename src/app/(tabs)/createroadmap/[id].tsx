



import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";


import { authClient } from "@/lib/auth-client";
import { Subject, Syllabus } from "../../../../types/roadmapTypes";
import { updateTopics, updateUnits } from "@/lib/roadmapHelpers";
import RoadmapView from "@/components/roadmap/RoadmapViw";



const API_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function RoadmapDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSyllabus = useCallback(async () => {
    if (!id) return;

    try {
      const cookie = await authClient.getCookie();

      const response = await fetch(`${API_URL}/api/syllabus/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie ?? "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch syllabus");
      }

      const data = await response.json();

      setSyllabus(data.syllabus);
    } catch (error) {
      console.error("Fetch syllabus error:", error);

      Alert.alert(
        "Error",
        "Unable to load this roadmap. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSyllabus();
  };

  const updateSyllabus = (updatedSubjects: Subject[]) => {
    setSyllabus((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        subjects: updatedSubjects,
      };
    });
  };

  const handleToggleSubject = (subjectId: string) => {
    if (!syllabus) return;

    const updatedSubjects = syllabus.subjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject;
      }

      const nextCompleted = !subject.completed;

      return {
        ...subject,
        completed: nextCompleted,
        units: updateUnits(subject.units, nextCompleted),
      };
    });

    updateSyllabus(updatedSubjects);

    // Call your backend persistence API here.
  };

  const handleToggleUnit = (
    subjectId: string,
    unitId: string
  ) => {
    if (!syllabus) return;

    const updatedSubjects = syllabus.subjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject;
      }

      const updatedUnits = subject.units.map((unit) => {
        if (unit.id !== unitId) {
          return unit;
        }

        const nextCompleted = !unit.completed;

        return {
          ...unit,
          completed: nextCompleted,
          topics: updateTopics(unit.topics, nextCompleted),
        };
      });

      return {
        ...subject,
        units: updatedUnits,
        completed: updatedUnits.every((unit) => unit.completed),
      };
    });

    updateSyllabus(updatedSubjects);

    // Call your backend persistence API here.
  };

  const handleToggleTopic = (
    subjectId: string,
    unitId: string,
    topicId: string
  ) => {
    if (!syllabus) return;

    const updatedSubjects = syllabus.subjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject;
      }

      const updatedUnits = subject.units.map((unit) => {
        if (unit.id !== unitId) {
          return unit;
        }

        const updatedTopics = unit.topics.map((topic) => {
          if (topic.id !== topicId) {
            return topic;
          }

          const nextCompleted = !topic.completed;

          return {
            ...topic,
            completed: nextCompleted,
            subTopics: topic.subTopics.map((subTopic) => ({
              ...subTopic,
              completed: nextCompleted,
            })),
          };
        });

        return {
          ...unit,
          topics: updatedTopics,
          completed: updatedTopics.every((topic) => topic.completed),
        };
      });

      return {
        ...subject,
        units: updatedUnits,
        completed: updatedUnits.every((unit) => unit.completed),
      };
    });

    updateSyllabus(updatedSubjects);

    // Call your backend persistence API here.
  };

  const handleToggleSubTopic = (
    subjectId: string,
    unitId: string,
    topicId: string,
    subTopicId: string
  ) => {
    if (!syllabus) return;

    const updatedSubjects = syllabus.subjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject;
      }

      const updatedUnits = subject.units.map((unit) => {
        if (unit.id !== unitId) {
          return unit;
        }

        const updatedTopics = unit.topics.map((topic) => {
          if (topic.id !== topicId) {
            return topic;
          }

          const updatedSubTopics = topic.subTopics.map((subTopic) => {
            if (subTopic.id !== subTopicId) {
              return subTopic;
            }

            return {
              ...subTopic,
              completed: !subTopic.completed,
            };
          });

          return {
            ...topic,
            subTopics: updatedSubTopics,
            completed: updatedSubTopics.every(
              (subTopic) => subTopic.completed
            ),
          };
        });

        return {
          ...unit,
          topics: updatedTopics,
          completed: updatedTopics.every((topic) => topic.completed),
        };
      });

      return {
        ...subject,
        units: updatedUnits,
        completed: updatedUnits.every((unit) => unit.completed),
      };
    });

    updateSyllabus(updatedSubjects);

    // Call your backend persistence API here.
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A673" />
        <Text style={styles.loadingText}>Loading roadmap...</Text>
      </View>
    );
  }

  if (!syllabus) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Roadmap could not be found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#16A673"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <RoadmapView
        syllabus={syllabus}
        onToggleSubject={handleToggleSubject}
        onToggleUnit={handleToggleUnit}
        onToggleTopic={handleToggleTopic}
        onToggleSubTopic={handleToggleSubTopic}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FBF9",
  },

  content: {
    padding: 16,
    paddingTop: 24,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBF9",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#789083",
    fontSize: 14,
  },

  errorText: {
    color: "#B42318",
    fontSize: 15,
    textAlign: "center",
  },
});