export type SubTopic = { id: string; name: string; completed: boolean };
export type Topic = {
  id: string;
  name: string;
  completed: boolean;
  subTopics: SubTopic[];
};
export type Unit = {
  id: string;
  name: string;
  // What the syllabus called it: "Unit", "Chapter", "Module", ...
  sourceLabel?: string | null;
  topics: Topic[];
};
export type DocumentType =
  | "school"
  | "college"
  | "competitive_exam"
  | "professional"
  | "other";
export type Roadmap = {
  id: string;
  name: string;
  isFollowing: boolean;
  examOrBoard?: string | null;
  subjectGroup?: string | null;
  examGroupId?: string | null;
  // The syllabus upload it was generated from (its PDF can be viewed while stored)
  uploadId?: string | null;
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
  documentType: DocumentType | null;
  examOrBoard: string | null;
  subjectGroup: string | null; // "Semester 3", "Prelims", ...
  examGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  unitCount: number;
  progress: RoadmapProgress;
};

// Roadmaps generated from one multi-subject PDF, e.g. "JEE Main 2026"
export type ExamGroup = {
  id: string;
  name: string;
  examOrBoard: string | null;
  createdAt: string;
  updatedAt: string;
  // For POST /syllabus/:uploadId/roadmaps; only usable while canGenerate (upload not expired)
  uploadId: string | null;
  canGenerate: boolean;
  roadmaps: RoadmapSummary[];
  // Every subject detected in the group's PDF; roadmapId is set once it's created
  subjects: (AnalyzeSubject & { roadmapId: string | null })[];
  progress: { totalTopics: number; completedTopics: number; percent: number };
};

// POST /api/syllabus/analyze
export type AnalyzeSubject = {
  index: number; // sent back in subjectIndexes to generate this subject
  name: string;
  group: string | null;
  startPage: number;
  endPage: number;
};
export type AnalyzeResponse = {
  uploadId: string;
  // null when the PDF is stored permanently (subjects can be generated any time)
  expiresAt: string | null;
  hasPdf?: boolean;
  pageCount: number;
  fromCache: boolean;
  documentType: DocumentType | null;
  examOrBoard: string | null;
  language: string | null;
  subjects: AnalyzeSubject[];
};

// POST /api/syllabus/:uploadId/roadmaps
export type GenerateBody =
  | { subjectIndexes: number[] }
  | { custom: { name: string; startPage?: number; endPage?: number } };
export type GenerateResult = {
  index: number | null; // null for a custom subject
  name: string;
  group: string | null;
} & (
  | { status: "SUCCEEDED"; warnings: string[]; roadmap: Roadmap }
  | { status: "FAILED"; error: string }
);
export type GenerateResponse = {
  examGroupId: string | null;
  results: GenerateResult[];
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