import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";
import { formatDuration, plural } from "@/lib/studySession";
import { dayLabel } from "./dates";
import type { RecentSession, SessionUnit } from "../../../types/roadmapTypes";

// A past study session; tap to see what was completed in it, grouped by unit
export default function SessionRow({ session, last }: { session: RecentSession; last: boolean }) {
  const [open, setOpen] = useState(false);
  const units = session.units ?? [];
  const hasItems = session.topicsCompleted + session.subTopicsCompleted > 0;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={!last && styles.divider}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityHint="Shows what you completed in this session"
      >
        <View style={styles.icon}>
          <Ionicons name="book-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {session.roadmapName}
          </Text>
          <Text style={styles.meta}>
            {session.endedOnDay ? dayLabel(session.endedOnDay) : ""} ·{" "}
            {plural(session.topicsCompleted, "topic")} ·{" "}
            {plural(session.subTopicsCompleted, "subtopic")}
          </Text>
        </View>
        <Text style={styles.time}>{formatDuration(session.elapsedSeconds)}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      {open && (
        <View style={styles.details}>
          {!hasItems ? (
            <Text style={styles.empty}>
              Nothing was ticked off in this session, but the study time still counts.
            </Text>
          ) : units.length === 0 ? (
            <Text style={styles.empty}>Details aren't available for this session yet.</Text>
          ) : (
            units.map((unit, i) => <UnitBlock key={`${unit.name}-${i}`} unit={unit} />)
          )}
        </View>
      )}
    </View>
  );
}

function UnitBlock({ unit }: { unit: SessionUnit }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.unitName}>{unit.name ?? "Other (removed from the roadmap)"}</Text>
      {unit.topics.map((topic, i) => (
        <View key={`t-${i}`} style={styles.item}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={styles.topicText}>{topic}</Text>
        </View>
      ))}
      {unit.subTopics.map((sub, i) => (
        <View key={`s-${i}`} style={styles.item}>
          <Ionicons name="checkmark" size={15} color={colors.primary} style={styles.subIcon} />
          <Text style={styles.subText}>
            {sub.name}
            {sub.topicName ? <Text style={styles.subTopicOf}>{`  ·  ${sub.topicName}`}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  pressed: { backgroundColor: colors.primarySoft },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  time: { fontSize: 15, fontWeight: "800", color: colors.primaryDark },

  details: {
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    gap: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  empty: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  unit: { gap: 6 },
  unitName: { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  topicText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 19 },
  subIcon: { marginLeft: 1, marginTop: 2 },
  subText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  subTopicOf: { color: colors.textSecondary },
});
