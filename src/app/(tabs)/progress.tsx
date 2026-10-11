import { errorMessage } from "@/lib/api";
import { colors, radius, shadow } from "@/lib/theme";
import { formatDuration, plural, studyApi } from "@/lib/studySession";
import StreakCalendar from "@/components/study/StreakCalendar";
import WeekChart from "@/components/study/WeekChart";
import { dayLabel } from "@/components/study/dates";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ProgressData } from "../../../types/roadmapTypes";

// Progress tab: streak, today's study, the last 7 days and recent sessions
export default function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await studyApi.progress(7));
    } catch (err) {
      console.error("Error loading progress:", err);
      setError(errorMessage(err, "Couldn't load your progress."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        {error ? (
          <>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
            <Text style={styles.mutedText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  const { streak, today, days, recentSessions } = data;
  const weekSeconds = days.reduce((n, d) => n + d.seconds, 0);
  const streakLine = streak.studiedToday
    ? "You studied today. Nice work!"
    : streak.current > 0
      ? "Study today to keep your streak going."
      : "Study for at least a minute to start a streak.";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Your study time, streak and what you've finished</Text>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.flame}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakNumber}>
              {streak.current} <Text style={styles.streakUnit}>day streak</Text>
            </Text>
            <Text style={styles.streakLine}>{streakLine}</Text>
          </View>
          <View style={styles.best}>
            <Text style={styles.bestValue}>{streak.longest}</Text>
            <Text style={styles.bestLabel}>Best</Text>
          </View>
        </View>

        {/* Today */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.tiles}>
          <Tile icon="time-outline" value={formatDuration(today.seconds)} label="Studied" />
          <Tile icon="checkmark-done-outline" value={String(today.topics)} label="Topics" />
          <Tile icon="list-outline" value={String(today.subTopics)} label="Subtopics" />
        </View>

        {/* Last 7 days */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Last 7 days</Text>
            <Text style={styles.cardMeta}>{formatDuration(weekSeconds)} total</Text>
          </View>
          <WeekChart days={days} />
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Study days</Text>
            <Text style={styles.cardMeta}>Filled = studied 1+ min</Text>
          </View>
          <StreakCalendar today={today.day} studyDays={data.studyDays} />
        </View>

        {/* Recent sessions */}
        <Text style={styles.sectionTitle}>Recent sessions</Text>
        {recentSessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="stopwatch-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyText}>
              Open a subject in one of your spaces and tap Start studying. Your sessions will
              show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentSessions.map((s, i) => (
              <View
                key={s.id}
                style={[styles.sessionRow, i < recentSessions.length - 1 && styles.divider]}
              >
                <View style={styles.sessionIcon}>
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {s.roadmapName}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {s.endedOnDay ? dayLabel(s.endedOnDay) : ""} ·{" "}
                    {plural(s.topicsCompleted, "topic")} · {plural(s.subTopicsCompleted, "subtopic")}
                  </Text>
                </View>
                <Text style={styles.sessionTime}>{formatDuration(s.elapsedSeconds)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  mutedText: { fontSize: 14, color: colors.textSecondary },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.white, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.6 },
  subtitle: { marginTop: 4, marginBottom: 18, fontSize: 14, color: colors.textSecondary },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: "#FFF4E5",
    borderWidth: 1,
    borderColor: "#FFE1B8",
  },
  flame: { fontSize: 38 },
  streakNumber: { fontSize: 30, fontWeight: "800", color: "#8A4B00" },
  streakUnit: { fontSize: 15, fontWeight: "700" },
  streakLine: { marginTop: 2, fontSize: 13, color: "#8A4B00" },
  best: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  bestValue: { fontSize: 18, fontWeight: "800", color: "#8A4B00" },
  bestLabel: { fontSize: 11, color: "#8A4B00" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  tiles: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  tileValue: { marginTop: 8, fontSize: 20, fontWeight: "800", color: colors.text },
  tileLabel: { marginTop: 2, fontSize: 12, color: colors.textSecondary },

  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textSecondary },

  empty: {
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: "center" },
  list: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionName: { fontSize: 15, fontWeight: "700", color: colors.text },
  sessionMeta: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  sessionTime: { fontSize: 15, fontWeight: "800", color: colors.primaryDark },
});
