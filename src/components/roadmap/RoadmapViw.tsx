import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Roadmap, SubTopic, Topic, Unit } from "../../../types/roadmapTypes";
import { confirmDelete } from "@/lib/confirm";
import { colors, radius, shadow } from "@/lib/theme";
import ProgressRing from "@/components/ui/ProgressRing";

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
  // Shown when the roadmap's syllabus PDF can be opened
  onViewPdf?: () => void;
};

type CheckState = "checked" | "partial" | "none";

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

/* ---------- small pieces ---------- */
function Checkbox({
  state,
  onPress,
  round,
  label,
}: {
  state: CheckState;
  onPress: () => void;
  // Subtopics use a smaller round check to set them apart from topics
  round?: boolean;
  label: string;
}) {
  const on = state !== "none";
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: state === "partial" ? "mixed" : on }}
      style={[
        styles.checkbox,
        round && styles.checkboxRound,
        on && styles.checkboxOn,
      ]}
    >
      {state === "checked" && (
        <Ionicons name="checkmark" size={round ? 13 : 16} color={colors.white} />
      )}
      {state === "partial" && (
        <Ionicons name="remove" size={round ? 13 : 16} color={colors.white} />
      )}
    </Pressable>
  );
}

function MiniBar({ percent }: { percent: number }) {
  return (
    <View style={styles.miniTrack}>
      <View style={[styles.miniFill, { width: `${percent}%` }]} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    <Pressable
      onPress={onToggle}
      onLongPress={() => confirmDelete(subTopic.name, onDelete)}
      style={({ pressed }) => [styles.subRow, pressed && styles.pressed]}
    >
      <Checkbox
        round
        state={subTopic.completed ? "checked" : "none"}
        onPress={onToggle}
        label={subTopic.name}
      />
      <Text style={[styles.subText, subTopic.completed && styles.doneText]}>
        {subTopic.name}
      </Text>
    </Pressable>
  );
}

/* ---------- Topic ---------- */
function TopicItem({
  topic,
  last,
  onToggle,
  onDelete,
  onToggleSubTopic,
  onDeleteSubTopic,
}: {
  topic: Topic;
  last: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleSubTopic: (subTopicId: string) => void;
  onDeleteSubTopic: (subTopicId: string) => void;
}) {
  // Start expanded so subtopics are visible right away
  const [open, setOpen] = useState(true);

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
    <View style={[styles.topic, !last && styles.topicDivider]}>
      <Pressable
        onPress={hasSubs ? toggleOpen : onToggle}
        onLongPress={() => confirmDelete(topic.name, onDelete)}
        style={({ pressed }) => [styles.topicHeader, pressed && styles.pressed]}
      >
        <Checkbox state={state} onPress={onToggle} label={topic.name} />
        <View style={styles.flex}>
          <Text style={[styles.topicText, done && styles.doneText]}>
            {topic.name}
          </Text>
          {hasSubs && (
            <Text style={styles.topicMeta}>
              {doneSubs} of {subs.length} subtopics
            </Text>
          )}
        </View>
        {hasSubs && (
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
          />
        )}
      </Pressable>

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
function UnitCard({
  unit,
  index,
  open,
  onToggleOpen,
  props,
}: {
  unit: Unit;
  index: number;
  open: boolean;
  onToggleOpen: () => void;
  props: RoadmapViewProps;
}) {
  const done = isUnitDone(unit);
  const state = done ? "checked" : isUnitPartial(unit) ? "partial" : "none";
  const doneCount = unit.topics.filter(isTopicDone).length;
  const percent = unit.topics.length
    ? Math.round((doneCount / unit.topics.length) * 100)
    : 0;

  return (
    <View style={[styles.unitCard, done && styles.unitCardDone]}>
      <Pressable
        onPress={onToggleOpen}
        onLongPress={() =>
          confirmDelete(unit.name, () => props.onDeleteUnit(unit.id))
        }
        style={({ pressed }) => [styles.unitHeader, pressed && styles.pressed]}
      >
        <View style={[styles.unitBadge, done && styles.unitBadgeDone]}>
          {done ? (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          ) : (
            <Text style={styles.unitBadgeText}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.flex}>
          <Text style={[styles.unitText, done && styles.unitTextDone]}>
            {unit.name}
          </Text>
          <Text style={styles.unitMeta}>
            {unit.sourceLabel ? `${unit.sourceLabel} · ` : ""}
            {doneCount}/{unit.topics.length} topics
          </Text>
          <MiniBar percent={percent} />
        </View>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      {open && (
        <View style={styles.unitBody}>
          {unit.topics.length > 0 && (
            <Pressable
              onPress={() => props.onToggleUnit(unit.id)}
              style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
            >
              <Checkbox
                state={state}
                onPress={() => props.onToggleUnit(unit.id)}
                label={`Mark all of ${unit.name}`}
              />
              <Text style={styles.markAllText}>
                {done ? "Unmark all topics" : "Mark all topics as done"}
              </Text>
            </Pressable>
          )}

          {unit.topics.length === 0 && (
            <Text style={styles.emptyText}>No topics in this unit.</Text>
          )}
          {unit.topics.map((t, i) => (
            <TopicItem
              key={t.id}
              topic={t}
              last={i === unit.topics.length - 1}
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
  const allSubs = allTopics.flatMap((t) => t.subTopics);
  const doneSubs = allSubs.filter((s) => s.completed).length;
  const doneUnits = roadmap.units.filter(isUnitDone).length;
  const percent = allTopics.length
    ? Math.round((doneTopics / allTopics.length) * 100)
    : 0;
  // e.g. "JEE Main 2026 · Paper I" for roadmaps generated from a multi-subject PDF
  const context = [roadmap.examOrBoard, roadmap.subjectGroup]
    .filter(Boolean)
    .join(" · ");

  // Open the first unfinished unit so the user lands where they left off
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>(() => {
    const next = roadmap.units.find((u) => !isUnitDone(u));
    return next ? { [next.id]: true } : {};
  });
  const allOpen =
    roadmap.units.length > 0 && roadmap.units.every((u) => openUnits[u.id]);

  const toggleUnitOpen = (unitId: string) => {
    animate();
    setOpenUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const toggleAll = () => {
    animate();
    setOpenUnits(
      allOpen
        ? {}
        : Object.fromEntries(roadmap.units.map((u) => [u.id, true])),
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            {context ? (
              <Text style={styles.context} numberOfLines={1}>
                {context.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.title}>{roadmap.name}</Text>
            <Text style={styles.heroSub}>
              {percent === 100
                ? "Roadmap complete. Great work! 🎉"
                : `${doneTopics} of ${allTopics.length} topics done`}
            </Text>
          </View>
          <ProgressRing percent={percent} size={76} stroke={8} inverted />
        </View>

        <View style={styles.statsRow}>
          <Stat value={`${doneUnits}/${roadmap.units.length}`} label="Units" />
          <View style={styles.statDivider} />
          <Stat value={`${doneTopics}/${allTopics.length}`} label="Topics" />
          <View style={styles.statDivider} />
          <Stat value={`${doneSubs}/${allSubs.length}`} label="Subtopics" />
        </View>

        {props.onViewPdf && (
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={props.onViewPdf}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.pdfBtnText}>View syllabus PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Units */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Units</Text>
        {roadmap.units.length > 1 && (
          <TouchableOpacity onPress={toggleAll} hitSlop={8}>
            <Text style={styles.linkText}>
              {allOpen ? "Collapse all" : "Expand all"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>
        Tap the box to tick an item off · press and hold to delete it
      </Text>

      <View style={styles.unitList}>
        {roadmap.units.map((unit, i) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            index={i}
            open={!!openUnits[unit.id]}
            onToggleOpen={() => toggleUnitOpen(unit.id)}
            props={props}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30 },
  flex: { flex: 1 },
  pressed: { backgroundColor: colors.primarySoft },

  /* hero */
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow.raised,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  context: {
    color: "#9FE0C6",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroSub: { color: "#CFEDE1", fontSize: 13, marginTop: 6 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: colors.white, fontSize: 17, fontWeight: "800" },
  statLabel: { color: "#CFEDE1", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.18)" },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  pdfBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: "700" },

  /* section */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  linkText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 14 },

  /* unit */
  unitList: { gap: 12 },
  unitCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  unitCardDone: { borderColor: "#BFE6D6" },
  unitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  unitBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  unitBadgeDone: { backgroundColor: colors.primary },
  unitBadgeText: { fontSize: 14, fontWeight: "800", color: colors.primaryDark },
  unitText: { fontSize: 16, fontWeight: "700", color: colors.text },
  unitTextDone: { color: colors.primaryDark },
  unitMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  miniTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryTint,
    overflow: "hidden",
    marginTop: 8,
  },
  miniFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },

  unitBody: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primarySoft,
  },
  markAllText: { fontSize: 13, fontWeight: "600", color: colors.primaryDark },

  /* topic */
  topic: { paddingHorizontal: 4 },
  topicDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  topicText: { fontSize: 15, fontWeight: "600", color: colors.text },
  topicMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  /* subtopic */
  subList: {
    marginLeft: 22,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryTint,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
  },
  subText: { flex: 1, fontSize: 14, color: "#3E5148", lineHeight: 20 },

  doneText: { textDecorationLine: "line-through", color: colors.textMuted },
  emptyText: { color: colors.textMuted, fontSize: 13, padding: 16 },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#B9DCCD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxRound: { width: 20, height: 20, borderRadius: 10 },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
