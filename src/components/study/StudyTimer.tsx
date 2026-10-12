import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadow } from "@/lib/theme";
import { formatClock, plural } from "@/lib/studySession";
import { useStudyClock, useStudySession } from "./StudySessionProvider";

// Stopwatch card at the top of a roadmap: start, pause/resume, end (or discard).
// The session itself lives in StudySessionProvider, shared with the pill above the tabs.
export default function StudyTimer({ roadmapId }: { roadmapId: string }) {
  const { session, loaded, busy, start, pause, resume, end, discard } = useStudySession();
  const elapsed = useStudyClock();

  if (!loaded) {
    return <View style={[styles.card, styles.placeholder]} />;
  }

  // Studying a different subject right now
  if (session && session.roadmapId !== roadmapId) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              Studying {session.roadmapName}
            </Text>
            <Text style={styles.sub}>
              {formatClock(elapsed)} · {session.running ? "running" : "paused"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={end}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>End it</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>End that session to start one here.</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="stopwatch-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Study timer</Text>
            <Text style={styles.sub}>
              Start it, then tick off what you finish. It counts toward today and your
              streak.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => start(roadmapId)}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="play" size={18} color={colors.white} />
              <Text style={styles.startBtnText}>Start studying</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const running = session.running;
  const counts =
    session.topicsCompleted + session.subTopicsCompleted > 0
      ? `+${plural(session.topicsCompleted, "topic")} · ${plural(session.subTopicsCompleted, "subtopic")} this session`
      : "Tick off topics as you finish them";

  return (
    <View style={[styles.card, styles.live]}>
      <View style={styles.liveTop}>
        <View style={[styles.statusPill, !running && styles.statusPillPaused]}>
          <View style={[styles.dot, !running && styles.dotPaused]} />
          <Text style={styles.statusText}>{running ? "STUDYING" : "PAUSED"}</Text>
        </View>
        <TouchableOpacity onPress={discard} hitSlop={8} disabled={busy}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.clock} accessibilityLabel={`Studied ${formatClock(elapsed)}`}>
        {formatClock(elapsed)}
      </Text>
      <Text style={styles.counts}>{counts}</Text>

      <View style={styles.liveActions}>
        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={running ? pause : resume}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Ionicons name={running ? "pause" : "play"} size={18} color={colors.white} />
          <Text style={styles.ghostBtnText}>{running ? "Pause" : "Resume"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.endBtn}
          onPress={end}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryDark} />
          ) : (
            <>
              <Ionicons name="stop" size={16} color={colors.primaryDark} />
              <Text style={styles.endBtnText}>End session</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    ...shadow.card,
  },
  placeholder: { height: 96 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  sub: { marginTop: 2, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  hint: { marginTop: 10, fontSize: 12, color: colors.textMuted },
  outlineBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: "center",
  },
  outlineBtnText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  startBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },

  live: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.raised },
  liveTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  statusPillPaused: { backgroundColor: "rgba(0,0,0,0.15)" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  dotPaused: { backgroundColor: "#FFE08A" },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, color: colors.white },
  discardText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  clock: {
    marginTop: 10,
    fontSize: 44,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  counts: { marginTop: 2, fontSize: 13, color: "rgba(255,255,255,0.9)" },
  liveActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  ghostBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ghostBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },
  endBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  endBtnText: { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
});
