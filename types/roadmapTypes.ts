  export type SubTopic = {
  id: string;
  name: string;
  completed: boolean;
};

export type Topic = {
  id: string;
  name: string;
  completed: boolean;
  subTopics: SubTopic[];
};
export type Unit = {
  id: string;
  name: string;
  completed: boolean;
  topics: Topic[];
};
export type Subject = {
  id: string;
  name: string;
  completed: boolean;
  units: Unit[];
};

export type Syllabus = {
  id: string;
  name: string;
  subjects: Subject[];
};

export type RoadmapCheckBoxProps = {
  onPress: () => void;
  size?: number;
  checked: boolean;
};

export type RoadmapSectionHeaderProps = {
  title: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  completed: boolean;
  level?: "subject" | "unit" | "topic";
};

export type SubTopicItemProps = {
  subTopic: SubTopic;
  onToggle: () => void;
};

export type TopicCardProps = {
  topic: Topic;
  onToggleTopic: () => void;
  onToggleSubTopic: (subTopicId: string) => void;
};

export type UnitCardProps = {
  unit: Unit;
  onToggleUnit: () => void;
  onToggleTopic: (topicId: string) => void;
  onToggleSubTopic: (topicId: string, subTopicId: string) => void;
};