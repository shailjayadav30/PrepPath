import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { RoadmapSummary } from "../../../types/roadmapTypes";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/lib/theme";

type Prop = {
  roadmap: RoadmapSummary;
  onPress: () => void;
  onDelete?: () => void;
  onToggleFollow?: () => void;
};

export default function RoadmapCard({
  roadmap,
  onPress,
  onDelete,
  onToggleFollow,
}: Prop) {
  const progress = roadmap.progress?.percent ?? 0;
  const done = roadmap.progress?.completedTopics ?? 0;
  const total = roadmap.progress?.totalTopics ?? 0;
  const following = roadmap.isFollowing;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, following && styles.containerFollowing]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={20} color={colors.primary} />
        </View>

        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={2}>
            {roadmap.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {roadmap.subjectGroup ?? roadmap.examOrBoard ?? "Your learning roadmap"}
            {roadmap.unitCount ? ` · ${roadmap.unitCount} units` : ""}
          </Text>
        </View>

        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={8}
            activeOpacity={0.7}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${roadmap.name}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {progress === 100 ? "Completed 🎉" : `${done} of ${total} topics done`}
        </Text>
        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {onToggleFollow ? (
          <TouchableOpacity
            onPress={onToggleFollow}
            hitSlop={6}
            activeOpacity={0.8}
            style={[styles.followBtn, following && styles.followBtnOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: following }}
          >
            <Ionicons
              name={following ? "checkmark" : "add"}
              size={16}
              color={following ? colors.white : colors.primary}
            />
            <Text style={[styles.followText, following && styles.followTextOn]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <View style={styles.openRow}>
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  containerFollowing: { borderColor: "#BFE6D6" },

  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: { flex: 1, paddingTop: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 21 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  progressLabel: { color: colors.textSecondary, fontSize: 13 },
  progressPercentage: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  progressTrack: {
    height: 8,
    backgroundColor: colors.primaryTint,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  followBtnOn: { backgroundColor: colors.primary },
  followText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  followTextOn: { color: colors.white },
  openRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  openText: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
