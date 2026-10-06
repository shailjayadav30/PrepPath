import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Roadmap } from "../../../types/roadmapTypes";
import { Ionicons } from "@expo/vector-icons";

type Prop = {
  roadmap: Roadmap;
  onPress: () => void;
  onDelete?: () => void;
  // isFollowing?: () => void;
  onToggleFollow?: () => void;
};

export default function RoadmapCard({
  roadmap,
  onPress,
  onDelete,
  onToggleFollow
}: Prop) {
  const progress: number = 68;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="book-outline" size={22} color="#16A673" />
          </View>

          <View style={styles.titleWrapper}>
            <Text style={styles.text} numberOfLines={2}>
              {roadmap.name}
            </Text>

            <Text style={styles.subtitle}>Your learning roadmap</Text>
          </View>
        </View>

        <View style={styles.delAct}>
          <TouchableOpacity onPress={onDelete} hitSlop={10} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={21} color="#C45B5B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleFollow}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <Text>
            {roadmap.isFollowing ? "Following":"Follow"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Progress Section */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Overall Progress</Text>

        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {progress === 100
            ? "Roadmap completed! 🎉"
            : "Keep going, you're making progress."}
        </Text>

        <Ionicons name="arrow-up-right-box-outline" size={20} color="#16A673" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EDE9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8F7F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  titleWrapper: {
    flex: 1,
  },

  text: {
    color: "#1E2D26",
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    color: "#8A9690",
    fontSize: 12,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF1EF",
    marginVertical: 18,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressLabel: {
    color: "#65736B",
    fontSize: 13,
    fontWeight: "500",
  },

  progressPercentage: {
    color: "#16A673",
    fontSize: 18,
    fontWeight: "700",
  },

  progressTrack: {
    height: 9,
    backgroundColor: "#E5EDE8",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#16A673",
    borderRadius: 20,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  footerText: {
    color: "#8A9690",
    fontSize: 12,
  },
  delAct: {
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
});
