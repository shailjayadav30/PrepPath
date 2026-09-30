import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { Roadmap } from "../../../types/roadmapTypes";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const WHITE = "#FFFFFF";
const GREEN_TINT = "#E8F6F1";
const TEXT_MUTED = "#5F6F68";

export default function Index() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const router = useRouter();

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getRoadmap = useCallback(async () => {
    if (!userId) return;
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
      setRoadmaps(data.roadmaps ?? []);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    getRoadmap();
  }, [getRoadmap]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading your roadmaps...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Roadmaps</Text>
          <Text style={styles.headerSubtitle}>
            {roadmaps.length > 0
              ? `${roadmaps.length} roadmap${roadmaps.length > 1 ? "s" : ""} you're following`
              : "Start your study journey"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={createRoadmap}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color={WHITE} />
        </TouchableOpacity>
      </View>

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
              tintColor={GREEN}
              colors={[GREEN]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => openRoadmap(item.id)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="map" size={22} color={GREEN} />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.cardHint}>Tap to continue studying</Text>
              </View>

              <Ionicons name="chevron-forward" size={22} color={GREEN} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="map-outline" size={48} color={GREEN} />
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
            <Ionicons name="cloud-upload-outline" size={20} color={WHITE} />
            <Text style={styles.primaryButtonText}>Create Roadmap</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  center: {
    flex: 1,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: TEXT_MUTED,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: GREEN_DARK,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D9EFE7",
    borderLeftWidth: 5,
    borderLeftColor: GREEN,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: GREEN_DARK,
  },
  cardHint: {
    marginTop: 3,
    fontSize: 13,
    color: TEXT_MUTED,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: GREEN_DARK,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_MUTED,
    textAlign: "center",
    marginBottom: 28,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
    gap: 8,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
});
