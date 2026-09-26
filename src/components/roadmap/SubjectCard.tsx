import { useState } from "react";
import { StyleSheet, View } from "react-native";
import RoadmapSectionHeader from "./RoadmapSectionHeader";
import UnitCard from "./UnitCard";
import { Subject } from "../../../types/roadmapTypes";

type SubjectCardProps = {
  subject: Subject;
  onToggleSubject: () => void;
  onToggleUnit: (unitId: string) => void;
  onToggleTopic: (unitId: string, topicId: string) => void;
  onToggleSubTopic: (
    unitId: string,
    topicId: string,
    subTopicId: string
  ) => void;
};

export default function SubjectCard({
  subject,
  onToggleSubject,
  onToggleUnit,
  onToggleTopic,
  onToggleSubTopic,
}: SubjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <RoadmapSectionHeader
        title={subject.name}
        expanded={expanded}
        completed={subject.completed}
        level="subject"
        onToggleExpand={() => setExpanded((previous) => !previous)}
        onToggleComplete={onToggleSubject}
      />

      {expanded && (
        <View style={styles.children}>
          {subject.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onToggleUnit={() => onToggleUnit(unit.id)}
              onToggleTopic={(topicId) =>
                onToggleTopic(unit.id, topicId)
              }
              onToggleSubTopic={(topicId, subTopicId) =>
                onToggleSubTopic(unit.id, topicId, subTopicId)
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
    marginBottom: 12,
  },

  children: {
    marginLeft: 8,
    marginTop: 6,
  },
});