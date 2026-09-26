import { View, StyleSheet } from "react-native";
import React, { useState } from "react";
import { UnitCardProps } from "../../../types/roadmapTypes";
import RoadmapSectionHeader from "./RoadmapSectionHeader";
import TopicCard from "./TopicCard";

export default function UnitCard({
  unit,
  onToggleUnit,
  onToggleTopic,
  onToggleSubTopic,
}: UnitCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.container}>
      <RoadmapSectionHeader
        title={unit.name}
        expanded={expanded}
        completed={unit.completed}
        level="unit"
        onToggleExpand={() => setExpanded((previous) => !previous)}
        onToggleComplete={onToggleUnit}
      />
      {expanded && (
        <View style={styles.children}>
          {unit.topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onToggleTopic={() => onToggleTopic(topic.id)}
              onToggleSubTopic={(subTopicId) =>
                onToggleSubTopic(topic.id, subTopicId)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },

  children: {
    marginLeft: 12,
    marginTop: 4,
  },
});
