import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Syllabus } from "../../../../types/roadmapTypes";
import RoadmapCard from "@/components/ui/RoadmapCard";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AllRoadmap() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  async function deleteRoadmap(roadmapId: string) {
    try {
      const cookie = await authClient.getCookie();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/syllabus/${roadmapId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie ?? "",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch syllabus");
      }
      setSyllabusList((prev) =>
        prev.filter((syllabus) => syllabus.id !== roadmapId),
      );
    } catch (error) {
      console.log("Error in deleting roadmap", error);
    }
  }
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function showALLRoadmap() {
      setLoading(true);
      setError(null);

      try {
        const cookie = await authClient.getCookie();

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/syllabus`,
          {
            method: "GET",
            headers: {
              Cookie: cookie ?? "",
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error in getting roadmaps: ${errorText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setSyllabusList(data.syllabus ?? []);
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
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#16A673" />
        <Text style={styles.loadingText}>Loading your roadmaps...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color="#C45B5B" />

        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Your Roadmaps</Text>

          <Text style={styles.subtitle}>
            Keep learning, one step at a time.
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{syllabusList.length}</Text>
        </View>
      </View>

      {/* Roadmap List */}
      {syllabusList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#B8C9BF" />

          <Text style={styles.emptyTitle}>No roadmaps yet</Text>

          <Text style={styles.emptyText}>
            Create your first roadmap and start your learning journey.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {syllabusList.map((syllabus) => (
            <RoadmapCard
              key={syllabus.id}
              syllabus={syllabus}
              onDelete={() => deleteRoadmap(syllabus.id)}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/createroadmap/[id]",
                  params: {
                    id: syllabus.id,
                  },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9F7",
    paddingHorizontal: 20,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 24,
  },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E2D26",
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 14,
    color: "#87968D",
    marginTop: 6,
  },

  countBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E1F4EA",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A673",
  },

  content: {
    paddingBottom: 32,
  },

  loadingText: {
    color: "#87968D",
    fontSize: 14,
    marginTop: 12,
  },

  errorText: {
    color: "#C45B5B",
    fontSize: 15,
    marginTop: 12,
    textAlign: "center",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1E2D26",
    marginTop: 18,
  },

  emptyText: {
    fontSize: 14,
    color: "#87968D",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
});
