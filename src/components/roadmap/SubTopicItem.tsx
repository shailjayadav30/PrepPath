import { View, Text, StyleSheet } from "react-native";
import { SubTopicItemProps } from "../../../types/roadmapTypes";
import RoadmapCheckBox from "./RoadmapCheckBox";

export default function SubTopicItem({
  subTopic,
  onToggle,
}: SubTopicItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bullet} />

      <Text style={[styles.title, subTopic.completed && styles.completedTitle]}>
        {subTopic.name}
      </Text>

      <RoadmapCheckBox
        checked={subTopic.completed}
        onPress={onToggle}
        size={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 4,
    gap: 10,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#91A79A",
  },

  title: {
    flex: 1,
    color: "#53645A",
    fontSize: 13,
    lineHeight: 19,
  },

  completedTitle: {
    color: "#16A673",
    textDecorationLine: "line-through",
  },
});
