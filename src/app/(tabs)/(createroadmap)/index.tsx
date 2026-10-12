import { apiJson, errorMessage } from "@/lib/api";
import { colors, radius, shadow } from "@/lib/theme";
import NameModal from "@/components/ui/NameModal";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useCachedValue, writeCache } from "@/lib/cache";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Space } from "../../../../types/roadmapTypes";

// Roadmap tab: the user's spaces (e.g. "UPSC 2027"), each holding its own roadmaps
export default function Spaces() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  // Last-loaded spaces show instantly on launch while the list refreshes
  const { data: session } = authClient.useSession();
  const cacheKey = session?.user.id ? `spaces:${session.user.id}` : null;
  const fresh = useRef(false);
  useCachedValue<Space[]>(cacheKey, setSpaces, () => fresh.current);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<{ spaces: Space[] }>("/spaces");
      fresh.current = true;
      setSpaces(data.spaces ?? []);
      if (cacheKey) writeCache(cacheKey, data.spaces ?? []);
    } catch (err) {
      console.error("Error loading spaces:", err);
      setError(errorMessage(err, "Couldn't load your spaces."));
    } finally {
      setRefreshing(false);
    }
  }, [cacheKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openSpace = (spaceId: string) =>
    router.push({ pathname: "/(tabs)/(createroadmap)/space/[spaceId]", params: { spaceId } });

  const createSpace = async (name: string) => {
    try {
      const { space } = await apiJson<{ space: Space }>("/spaces", {
        method: "POST",
        body: { name },
      });
      setCreating(false);
      openSpace(space.id);
    } catch (err) {
      Alert.alert("Couldn't create space", errorMessage(err, "Please try again."));
    }
  };

  const modal = (
    <NameModal
      visible={creating}
      title="New space"
      message="A space keeps the roadmaps for one exam or course together."
      placeholder="e.g. UPSC 2027"
      submitLabel="Create"
      onSubmit={createSpace}
      onClose={() => setCreating(false)}
    />
  );

  if (!spaces && !error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.mutedText}>Loading your spaces...</Text>
      </SafeAreaView>
    );
  }

  if (error && !spaces) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const list = spaces ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Spaces</Text>
          <Text style={styles.subtitle}>One space per exam or course you're studying for</Text>
        </View>
        {list.length > 0 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setCreating(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="New space"
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="layers-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Create your first space</Text>
          <Text style={styles.emptyText}>
            Make a space for each exam or course, like "UPSC 2027" or "Semester 3". Then add
            roadmaps for just the subjects you're studying.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setCreating(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.primaryBtnText}>New space</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openSpace(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Ionicons name="layers" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.roadmapCount === 0
                      ? "No roadmaps yet"
                      : `${item.roadmapCount} roadmap${item.roadmapCount === 1 ? "" : "s"} · ${item.progress.percent}% done`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
              {item.roadmapCount > 0 && (
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${item.progress.percent}%` }]} />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.newCard}
              onPress={() => setCreating(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.newCardText}>New space</Text>
            </TouchableOpacity>
          }
        />
      )}
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  mutedText: { fontSize: 14, color: colors.textSecondary },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.6 },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },

  list: { paddingHorizontal: 20, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  cardMeta: { marginTop: 3, fontSize: 13, color: colors.textSecondary },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryTint,
    overflow: "hidden",
    marginTop: 14,
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },

  newCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A9D9C5",
    backgroundColor: colors.primarySoft,
  },
  newCardText: { fontSize: 15, fontWeight: "700", color: colors.primaryDark },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 21, fontWeight: "800", color: colors.text },
  emptyText: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadow.raised,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },
});
