import { Subject, SubTopic, Topic, Unit } from "../../types/roadmapTypes";
export function updateSubTopics(
  subTopics: SubTopic[],
  completed: boolean
): SubTopic[] {
  return subTopics.map((subTopic) => ({
    ...subTopic,
    completed,
  }));
}

export function updateTopics(
  topics: Topic[],
  completed: boolean
): Topic[] {
  return topics.map((topic) => ({
    ...topic,
    completed,
    subTopics: updateSubTopics(topic.subTopics, completed),
  }));
}

export function updateUnits(
  units: Unit[],
  completed: boolean
): Unit[] {
  return units.map((unit) => ({
    ...unit,
    completed,
    topics: updateTopics(unit.topics, completed),
  }));
}

export function updateSubjects(
  subjects: Subject[],
  completed: boolean
): Subject[] {
  return subjects.map((subject) => ({
    ...subject,
    completed,
    units: updateUnits(subject.units, completed),
  }));
}

export function calculateTopicCompleted(topic: Topic): boolean {
  return (
    topic.subTopics.length > 0 &&
    topic.subTopics.every((subTopic) => subTopic.completed)
  );
}

export function calculateUnitCompleted(unit: Unit): boolean {
  return (
    unit.topics.length > 0 &&
    unit.topics.every((topic) => topic.completed)
  );
}

export function calculateSubjectCompleted(subject: Subject): boolean {
  return (
    subject.units.length > 0 &&
    subject.units.every((unit) => unit.completed)
  );
}