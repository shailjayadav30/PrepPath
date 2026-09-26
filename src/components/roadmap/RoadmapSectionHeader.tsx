import { Pressable, StyleSheet, Text, View } from "react-native";
import { RoadmapSectionHeaderProps } from "../../../types/roadmapTypes";
import { Ionicons } from "@expo/vector-icons";

export default function RoadmapSectionHeader({
  title,
  expanded,
  onToggleExpand,
  onToggleComplete,
  completed,
  level = "subject",
}: RoadmapSectionHeaderProps) {
  const isSubject = level === "subject";
  const isUnit = level === "unit";
  return (
    <View
      style={[
        styles.container,
        isSubject && styles.subjectContainer,
        isUnit && styles.unitContainer,
      ]}
    >
      <Pressable
        onPress={onToggleExpand}
        style={styles.expandButton}
        hitSlop={6}
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={isSubject ? 21 : 18}
          color="#52635A"
        />
      </Pressable>
      <Pressable onPress={onToggleExpand} style={styles.titleContainer}>
        <Text
          style={[
            styles.title,
            isSubject && styles.subjectTitle,
            isUnit && styles.unitTitle,
          ]}
        >
          {title}
        </Text>
      </Pressable>
      <Pressable onPress={onToggleComplete} hitSlop={8}>
        <View style={[styles.checkbox, completed && styles.completedCheckbox]}>
          {completed && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },

  subjectContainer: {
    minHeight: 58,
    backgroundColor: "#EAF7F0",
    borderRadius: 14,
  },

  unitContainer: {
    backgroundColor: "#F4F8F5",
  },

  expandButton: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },

  title: {
    color: "#35443B",
    fontSize: 14,
    lineHeight: 20,
  },

  subjectTitle: {
    color: "#173D2D",
    fontSize: 16,
    fontWeight: "700",
  },

  unitTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#B8C4BD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  completedCheckbox: {
    backgroundColor: "#16A673",
    borderColor: "#16A673",
  },
});
