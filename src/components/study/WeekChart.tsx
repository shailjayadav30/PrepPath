import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { formatDuration, plural } from "@/lib/studySession";
import { dayLabel, weekdayShort } from "./dates";
import type { ProgressDay } from "../../../types/roadmapTypes";

const CHART_HEIGHT = 120;
const BAR_WIDTH = 22; // thin marks: never fill the slot

// Minutes studied per day (single series, so no legend). Tap a bar for its details;
// only today's value is labeled on the chart.
export default function WeekChart({ days }: { days: ProgressDay[] }) {
  const today = days.at(-1)?.day;
  const [selected, setSelected] = useState<string | undefined>(today);
  const max = Math.max(...days.map((d) => d.seconds), 60);
  const picked = days.find((d) => d.day === selected) ?? days.at(-1);

  return (
    <View>
      {picked && (
        <Text style={styles.readout}>
          <Text style={styles.readoutDay}>{picked.day === today ? "Today" : dayLabel(picked.day)}</Text>
          {"  "}
          {picked.seconds > 0
            ? `${formatDuration(picked.seconds)} · ${plural(picked.topics, "topic")} · ${plural(picked.subTopics, "subtopic")}`
            : "No study"}
        </Text>
      )}

      <View style={styles.plot}>
        {days.map((d) => {
          const height = d.seconds > 0 ? Math.max(4, (d.seconds / max) * CHART_HEIGHT) : 0;
          const isToday = d.day === today;
          const isSelected = d.day === picked?.day;
          return (
            <Pressable
              key={d.day}
              style={styles.slot}
              onPress={() => setSelected(d.day)}
              accessibilityRole="button"
              accessibilityLabel={`${dayLabel(d.day)}: ${d.seconds > 0 ? formatDuration(d.seconds) : "no study"}`}
            >
              {isToday && d.seconds > 0 && (
                <Text style={styles.valueLabel}>{formatDuration(d.seconds)}</Text>
              )}
              <View style={[styles.bar, { height }, isSelected && styles.barSelected]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.baseline} />

      <View style={styles.labels}>
        {days.map((d) => (
          <Text
            key={d.day}
            style={[styles.dayText, d.day === picked?.day && styles.dayTextOn]}
          >
            {d.day === today ? "Today" : weekdayShort(d.day)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  readoutDay: { fontWeight: "700", color: colors.text },
  plot: {
    height: CHART_HEIGHT + 20,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  slot: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  valueLabel: { fontSize: 11, fontWeight: "700", color: colors.text, marginBottom: 4 },
  // 4px rounded data-end, square at the baseline
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.primary,
  },
  // Selected day is darker; every bar keeps full contrast against the surface
  barSelected: { backgroundColor: colors.primaryDark },
  baseline: { height: 1, backgroundColor: colors.border },
  labels: { flexDirection: "row", marginTop: 6 },
  dayText: { flex: 1, textAlign: "center", fontSize: 11, color: colors.textMuted },
  dayTextOn: { color: colors.text, fontWeight: "700" },
});
