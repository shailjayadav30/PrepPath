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
  spaceId?: string;
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
  spaceId: string;
  createdAt: string;
  updatedAt: string;
  unitCount: number;
  progress: RoadmapProgress;
};

type SpaceProgress = { totalTopics: number; completedTopics: number; percent: number };

// A user-named collection of roadmaps, e.g. "UPSC 2027" (GET /api/spaces)
export type Space = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  roadmapCount: number;
  progress: SpaceProgress;
};

// A PDF uploaded into a space, with every subject detected in it
export type SpaceUpload = {
  id: string; // for POST /syllabus/:uploadId/roadmaps while canGenerate
  fileName: string | null;
  pageCount: number;
  createdAt: string;
  examOrBoard: string | null;
  canGenerate: boolean;
  subjects: AnalyzeSubject[];
};

// GET /api/spaces/:spaceId
export type SpaceDetail = Omit<Space, "roadmapCount"> & {
  roadmaps: RoadmapSummary[];
  uploads: SpaceUpload[];
};

// POST /api/syllabus/analyze
export type AnalyzeSubject = {
  index: number; // sent back in subjectIndexes to generate this subject
  name: string;
  group: string | null;
  startPage: number;
  endPage: number;
  // Set when the space already has a roadmap for this subject
  roadmapId?: string | null;
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
  spaceId: string;
  results: GenerateResult[];
};
// A stopwatch study session on a roadmap (GET /api/study-sessions/active, ...)
export type StudySession = {
  id: string;
  roadmapId: string | null; // null once the roadmap is deleted
  roadmapName: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  running: boolean;
  elapsedSeconds: number; // as of the response
  startedAt: string;
  endedAt: string | null;
  endedOnDay: string | null;
  // Items ticked while this session was open
  topicIds: string[];
  subTopicIds: string[];
  topicsCompleted: number;
  subTopicsCompleted: number;
};

export type Streak = { current: number; longest: number; studiedToday: boolean };

// POST /api/study-sessions/:id/end
export type EndSessionResponse = {
  session: StudySession;
  countsTowardStreak: boolean;
  streak: Streak;
};

export type ProgressDay = {
  day: string; // "2026-10-12"
  seconds: number;
  sessions: number;
  topics: number;
  subTopics: number;
};

// GET /api/progress
export type ProgressData = {
  today: ProgressDay;
  days: ProgressDay[]; // oldest first, ending today
  streak: Streak;
  studyDays: string[];
  recentSessions: RecentSession[];
};

// What a session completed in one unit (name is null if the items were deleted since)
export type SessionUnit = {
  name: string | null;
  topics: string[];
  subTopics: { name: string; topicName: string | null }[];
};

export type RecentSession = Omit<StudySession, "topicIds" | "subTopicIds" | "running"> & {
  // Missing on backends deployed before it was added
  units?: SessionUnit[];
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