import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius } from "@/lib/theme";
import { formatDuration } from "@/lib/studySession";
import type { EndSessionResponse } from "../../../types/roadmapTypes";

// Shown when a study session ends: time, what was completed, and the streak
export default function SessionSummary({
  result,
  onClose,
}: {
  result: EndSessionResponse | null;
  onClose: () => void;
}) {
  const session = result?.session;
  const streak = result?.streak;

  return (
    <Modal visible={!!result} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {session && streak && (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={32} color={colors.white} />
            </View>
            <Text style={styles.title}>Session saved</Text>
            <Text style={styles.subject} numberOfLines={2}>
              {session.roadmapName}
            </Text>

            <View style={styles.stats}>
              <Stat value={formatDuration(session.elapsedSeconds)} label="Studied" />
              <View style={styles.divider} />
              <Stat value={String(session.topicsCompleted)} label="Topics" />
              <View style={styles.divider} />
              <Stat value={String(session.subTopicsCompleted)} label="Subtopics" />
            </View>

            {result.countsTowardStreak ? (
              <View style={styles.streak}>
                <Text style={styles.flame}>🔥</Text>
                <Text style={styles.streakText}>
                  {streak.current === 1
                    ? "Day 1 of your streak. Come back tomorrow!"
                    : `${streak.current}-day streak! Keep it going.`}
                </Text>
              </View>
            ) : (
              <View style={[styles.streak, styles.streakMuted]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.streakMutedText}>
                  Study at least 1 minute today to keep your streak.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(10, 30, 22, 0.5)",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14, fontSize: 21, fontWeight: "800", color: colors.text },
  subject: { marginTop: 4, fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primaryDark },
  statLabel: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  divider: { width: 1, height: 30, backgroundColor: colors.border },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#FFF4E5",
  },
  flame: { fontSize: 20 },
  streakText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#8A4B00" },
  streakMuted: { backgroundColor: colors.bg },
  streakMutedText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  doneBtn: {
    alignSelf: "stretch",
    marginTop: 18,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { fontSize: 16, fontWeight: "700", color: colors.white },
});
