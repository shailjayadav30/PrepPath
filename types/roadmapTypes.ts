export type SubTopic = { id: string; name: string; completed: boolean };
export type Topic = {
  id: string;
  name: string;
  completed: boolean;
  subTopics: SubTopic[];
};
export type Unit = { id: string; name: string; topics: Topic[] };
export type Roadmap = {
  id: string;
  name: string;
  isFollowing: boolean;
  units: Unit[];
};
// List item from GET /api/roadmap and /api/roadmap/isfollowing (no unit tree)
export type RoadmapProgress = {
  totalTopics: number;
  completedTopics: number;
  totalSubTopics: number;
  completedSubTopics: number;
  percent: number;
};
export type RoadmapSummary = {
  id: string;
  name: string;
  isFollowing: boolean;
  createdAt: string;
  updatedAt: string;
  unitCount: number;
  progress: RoadmapProgress;
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


export const getInitials = (name?: string) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");