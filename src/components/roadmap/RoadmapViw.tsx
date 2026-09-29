import { StyleSheet, Text, View } from "react-native";


import SubjectCard from "./SubjectCard";
import { Roadmap } from "../../../types/roadmapTypes";

type RoadmapViewProps = {
  roadmap: Roadmap;
  // onToggleSubject: (subjectId: string) => void;
  onToggleUnit: (subjectId: string, unitId: string) => void;
  onToggleTopic: (
    subjectId: string,
    unitId: string,
    topicId: string
  ) => void;
  onToggleSubTopic: (
    subjectId: string,
    unitId: string,
    topicId: string,
    subTopicId: string
  ) => void;
};

export default function RoadmapView({
  roadmap,
  onToggleUnit,
  onToggleTopic,
  onToggleSubTopic,
}: RoadmapViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roadmap.name}</Text>

      <Text style={styles.subtitle}>
        Track your progress, one step at a time.
      </Text>

      {/* <View style={styles.subjectList}>
        {roadmap.subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onToggleSubject={() => onToggleSubject(subject.id)}
            onToggleUnit={(unitId) =>
              onToggleUnit(subject.id, unitId)
            }
            onToggleTopic={(unitId, topicId) =>
              onToggleTopic(subject.id, unitId, topicId)
            }
            onToggleSubTopic={(unitId, topicId, subTopicId) =>
              onToggleSubTopic(
                subject.id,
                unitId,
                topicId,
                subTopicId
              )
            }
          />
        ))}
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
  },

  title: {
    color: "#173D2D",
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    color: "#789083",
    fontSize: 13,
    marginBottom: 20,
  },

  subjectList: {
    gap: 8,
  },
});