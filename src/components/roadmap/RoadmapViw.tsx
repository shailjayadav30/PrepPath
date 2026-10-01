import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Roadmap, SubTopic, Topic, Unit } from "../../../types/roadmapTypes";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const GREEN_TINT = "#E8F6F1";
const MUTED = "#789083";
const DANGER = "#D64545";

export type RoadmapViewProps = {
  roadmap: Roadmap;
  onToggleUnit: (unitId: string) => void;
  onToggleTopic: (unitId: string, topicId: string) => void;
  onToggleSubTopic: (
    unitId: string,
    topicId: string,
    subTopicId: string,
  ) => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteTopic: (unitId: string, topicId: string) => void;
  onDeleteSubTopic: (
    unitId: string,
    topicId: string,
    subTopicId: string,
  ) => void;
};

/* ---------- helpers ---------- */
export const isTopicDone = (t: Topic) =>
  t.subTopics.length > 0 ? t.subTopics.every((s) => s.completed) : t.completed;

export const isUnitDone = (u: Unit) =>
  u.topics.length > 0 && u.topics.every(isTopicDone);

const isUnitPartial = (u: Unit) =>
  !isUnitDone(u) &&
  u.topics.some((t) => isTopicDone(t) || t.subTopics.some((s) => s.completed));

const isTopicPartial = (t: Topic) =>
  !isTopicDone(t) && t.subTopics.some((s) => s.completed);

const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const confirmDelete = (label: string, onConfirm: () => void) =>
  Alert.alert("Delete", `Delete "${label}"? This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);

/* ---------- small pieces ---------- */
function Checkbox({
  state,
  onPress,
}: {
  state: "checked" | "partial" | "none";
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      style={[styles.checkbox, state !== "none" && styles.checkboxOn]}
    >
      {state === "checked" && (
        <Ionicons name="checkmark" size={16} color="#fff" />
      )}
      {state === "partial" && <Ionicons name="remove" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

function Chevron({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8}>
      <Ionicons
        name={open ? "chevron-up" : "chevron-down"}
        size={20}
        color={MUTED}
      />
    </TouchableOpacity>
  );
}

function DeleteButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.deleteBtn}>
      <Ionicons name="trash-outline" size={18} color={DANGER} />
    </TouchableOpacity>
  );
}

/* ---------- SubTopic ---------- */
function SubTopicRow({
  subTopic,
  onToggle,
  onDelete,
}: {
  subTopic: SubTopic;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.subRow}>
      <Checkbox
        state={subTopic.completed ? "checked" : "none"}
        onPress={onToggle}
      />
      <Text
        style={[styles.subText, subTopic.completed && styles.doneText]}
        onPress={onToggle}
      >
        {subTopic.name}
      </Text>
      <DeleteButton onPress={() => confirmDelete(subTopic.name, onDelete)} />
    </View>
  );
}


function TopicItem({
  topic,
  onToggle,
  onDelete,
  onToggleSubTopic,
  onDeleteSubTopic,
}: {
  topic: Topic;
  onToggle: () => void;
  onDelete: () => void;
  onToggleSubTopic: (subTopicId: string) => void;
  onDeleteSubTopic: (subTopicId: string) => void;
}) {
  // Start expanded so subtopics are visible right away. Use false to start collapsed.
  const [open, setOpen] = useState(true);

  // TEMP DEBUG: check Metro logs. If this prints [] or undefined, the problem is your data, not the UI.
  // console.log("TopicItem:", topic.name, topic.subTopics);

  const subs = topic.subTopics ?? [];
  const hasSubs = subs.length > 0;
  const doneSubs = subs.filter((s) => s.completed).length;
  const done = isTopicDone(topic);
  const state = done ? "checked" : isTopicPartial(topic) ? "partial" : "none";

  const toggleOpen = () => {
    animate();
    setOpen(!open);
  };

  return (
    <View style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <Checkbox state={state} onPress={onToggle} />
        <TouchableOpacity
          style={styles.topicTitleWrap}
          onPress={hasSubs ? toggleOpen : onToggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.topicText, done && styles.doneText]}>
            {topic.name}
          </Text>
          {hasSubs && (
            <Text style={styles.topicMeta}>
              {doneSubs}/{subs.length} subtopics
            </Text>
          )}
        </TouchableOpacity>
        {hasSubs && <Chevron open={open} onPress={toggleOpen} />}
        <DeleteButton onPress={() => confirmDelete(topic.name, onDelete)} />
      </View>

      {open && hasSubs && (
        <View style={styles.subList}>
          {subs.map((s) => (
            <SubTopicRow
              key={s.id}
              subTopic={s}
              onToggle={() => onToggleSubTopic(s.id)}
              onDelete={() => onDeleteSubTopic(s.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}


/* ---------- Unit ---------- */
function UnitCard({ unit, props }: { unit: Unit; props: RoadmapViewProps }) {
  const [open, setOpen] = useState(false);
  const done = isUnitDone(unit);
  const state = done ? "checked" : isUnitPartial(unit) ? "partial" : "none";
  const doneCount = unit.topics.filter(isTopicDone).length;

  const toggleOpen = () => {
    animate();
    setOpen(!open);
  };

  return (
    <View style={styles.unitCard}>
      <View style={styles.unitHeader}>
        <Checkbox state={state} onPress={() => props.onToggleUnit(unit.id)} />
        <TouchableOpacity
          style={styles.unitTitleWrap}
          onPress={toggleOpen}
          activeOpacity={0.7}
        >
          <Text style={[styles.unitText, done && styles.doneText]}>
            {unit.name}
          </Text>
          <Text style={styles.unitMeta}>
            {doneCount}/{unit.topics.length} topics
          </Text>
        </TouchableOpacity>
        <DeleteButton
          onPress={() =>
            confirmDelete(unit.name, () => props.onDeleteUnit(unit.id))
          }
        />
        <Chevron open={open} onPress={toggleOpen} />
      </View>

      {open && (
        <View style={styles.topicList}>
          {unit.topics.length === 0 && (
            <Text style={styles.emptyText}>No topics in this unit.</Text>
          )}
          {unit.topics.map((t) => (
            <TopicItem
              key={t.id}
              topic={t}
              onToggle={() => props.onToggleTopic(unit.id, t.id)}
              onDelete={() => props.onDeleteTopic(unit.id, t.id)}
              onToggleSubTopic={(sid) =>
                props.onToggleSubTopic(unit.id, t.id, sid)
              }
              onDeleteSubTopic={(sid) =>
                props.onDeleteSubTopic(unit.id, t.id, sid)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function RoadmapView(props: RoadmapViewProps) {
  const { roadmap } = props;
  const allTopics = roadmap.units.flatMap((u) => u.topics);
  const doneTopics = allTopics.filter(isTopicDone).length;
  const percent = allTopics.length
    ? Math.round((doneTopics / allTopics.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roadmap.name}</Text>
      <Text style={styles.subtitle}>
        Track your progress, one step at a time.
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {doneTopics}/{allTopics.length} topics completed · {percent}%
      </Text>

      <View style={styles.unitList}>
        {roadmap.units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} props={props} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30 },
  title: { color: "#173D2D", fontSize: 23, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: MUTED, fontSize: 13, marginBottom: 14 },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN_TINT,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: GREEN, borderRadius: 4 },
  progressText: { color: MUTED, fontSize: 12, marginTop: 6, marginBottom: 18 },

  unitList: { gap: 12 },
  unitCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9EFE7",
    overflow: "hidden",
  },
  unitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#F7FBF9",
  },
  unitTitleWrap: { flex: 1 },
  unitText: { fontSize: 16, fontWeight: "700", color: GREEN_DARK },
  unitMeta: { fontSize: 12, color: MUTED, marginTop: 2 },

  topicList: { padding: 10, gap: 8 },
  topicCard: {
    borderWidth: 1,
    borderColor: "#E4F1EC",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  topicText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#173D2D" },

  subList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: GREEN_TINT,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  subText: { flex: 1, fontSize: 14, color: "#3E5C4E" },

  doneText: { textDecorationLine: "line-through", color: MUTED },
  emptyText: { color: MUTED, fontSize: 13, padding: 6 },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: GREEN },
  deleteBtn: { padding: 2 },
  topicTitleWrap: { flex: 1 },
  topicMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
});
