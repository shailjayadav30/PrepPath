export type SubTopic = {
  id: string;
  name: string;
};

export type Topic = {
  id: string;
  name: string;
  subTopics: SubTopic[];
};
export type Unit = {
  id: string;
  name: string;
  topics: Topic[];
};
export type Subject = {
  id: string;
  name: string;
  units: Unit[];
};

export type Syllabus = {
  id: string;
  name: string;
  subjects: Subject[];
};
