import { View,StyleSheet, Text } from "react-native";
import React, { useState } from "react";
import { TopicCardProps } from "../../../types/roadmapTypes";
import RoadmapSectionHeader from "./RoadmapSectionHeader";
import SubTopicItem from "./SubTopicItem";

export default function TopicCard({
  topic,
  onToggleTopic,
  onToggleSubTopic,
}: TopicCardProps) {
      const [expanded, setExpanded] = useState(false);
  return (
     <View style={styles.container}>
      <RoadmapSectionHeader 
      title={topic.name}
      expanded={expanded}
      completed={topic.completed}
      level="topic"
      onToggleExpand={()=>setExpanded((previous)=>!previous)}
      onToggleComplete={onToggleTopic}
      />

      {
        expanded && (
            <View style={styles.children}>
                {
                    topic.subTopics.map((subTopic)=>(
                        <SubTopicItem 
                        key={subTopic.id}
                        subTopic={subTopic}
                        onToggle={()=>onToggleSubTopic(subTopic.id)}
                        />
                    ))
                }

                </View>
        )
      }
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginLeft: 8,
  },

  children: {
    marginLeft: 12,
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#DCE8E0",
  },
});
