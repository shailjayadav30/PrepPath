import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { addDays, weekdayIndex } from "./dates";

const WEEKS = 5;
const HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

// The last few weeks, Monday first; days that count toward the streak are filled
export default function StreakCalendar({
  today,
  studyDays,
}: {
  today: string;
  studyDays: string[];
}) {
  const studied = new Set(studyDays);
  // Start on the Monday WEEKS-1 weeks before this week's Monday
  const start = addDays(today, -weekdayIndex(today) - (WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );

  return (
    <View>
      <View style={styles.row}>
        {HEADERS.map((h, i) => (
          <Text key={i} style={styles.header}>
            {h}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0]} style={styles.row}>
          {week.map((day) => {
            const future = day > today;
            const on = studied.has(day);
            return (
              <View key={day} style={styles.cellWrap}>
                <View
                  style={[
                    styles.cell,
                    on && styles.cellOn,
                    day === today && styles.cellToday,
                    future && styles.cellFuture,
                  ]}
                  accessibilityLabel={`${day}${on ? ", studied" : ""}`}
                >
                  <Text style={[styles.cellText, on && styles.cellTextOn]}>
                    {Number(day.slice(8))}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  header: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 6,
  },
  cellWrap: { flex: 1, alignItems: "center", paddingVertical: 3 },
  cell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cellOn: { backgroundColor: colors.primary },
  cellToday: { borderWidth: 2, borderColor: colors.primaryDark },
  cellFuture: { opacity: 0.35 },
  cellText: { fontSize: 12, color: colors.textSecondary },
  cellTextOn: { color: colors.white, fontWeight: "700" },
});
