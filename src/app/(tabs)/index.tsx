import  { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

const FILTERS = [
  { id: "1", title: "All Topics" },
  { id: "2", title: "Incomplete (11)" },
  { id: "3", title: "Completed (24)" },
  { id: "4", title: "Highest Priority" },
];

const SECTIONS = [
  {
    id: "3",
    number: "3",
    status: "IN PROGRESS",
    doneLabel: "3/4 Done",
    title: "Non-Linear Structures & Trees",
    defaultOpen: true,
    items: [
      {
        id: "a",
        title: "Binary Search Trees (BST)",
        subtitle: "Finished Oct 12",
        state: "completed",
        badge: "Completed",
      },
      {
        id: "b",
        title: "AVL Trees & Balancing Rot...",
        subtitle: "Finished Oct 14",
        state: "completed",
        badge: "Completed",
      },
      {
        id: "c",
        title: "Red-Black Tree Properties",
        subtitle: "Finished Oct 17",
        state: "completed",
        badge: "Completed",
      },
      {
        id: "d",
        title: "B-Trees & Multi-way Search",
        subtitle: "Est. 45 min study",
        state: "next",
        badge: "Next Up",
      },
    ],
  },
  {
    id: "4",
    number: "4",
    status: "UPCOMING",
    doneLabel: "0/5 Done",
    title: "Graph Algorithms & Traversals",
    defaultOpen: true,
    items: [
      {
        id: "e",
        title: "Breadth-First Search (BFS)",
        subtitle: "Queue-based traversal & state space",
        state: "upcoming",
        badge: "60 min",
      },
      {
        id: "f",
        title: "Depth-First Search (DFS) & To...",
        subtitle: "Recursive call stacks & DAG dependencies",
        state: "upcoming",
        badge: "50 min",
      },
      {
        id: "g",
        title: "Dijkstra's Shortest Path",
        subtitle: "Priority queue relaxation technique",
        state: "upcoming",
        badge: "75 min",
      },
    ],
  },
];

// const TABS = [
//   { id: "roadmap", label: "Roadmap", icon: "map", active: true },
//   { id: "syllabi", label: "Syllabi", icon: "book-open" },
//   { id: "analytics", label: "Analytics", icon: "bar-chart-2" },
//   { id: "settings", label: "Settings", icon: "settings" },
// ];

const RoadmapItem = ({ item, isLast }) => {
  const isCompleted = item.state === "completed";
  const isNext = item.state === "next";

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineTrack}>
        <View
          style={[
            styles.timelineDot,
            (isCompleted || isNext) && styles.timelineDotDone,
          ]}
        >
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      <View
        style={[
          styles.timelineContent,
          isNext && styles.timelineContentNext,
        ]}
      >
        <View style={styles.timelineTopRow}>
          <Text
            style={[
              styles.itemTitle,
              isCompleted && styles.itemTitleCompleted,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View
            style={[
              styles.badge,
              isCompleted && styles.badgeCompleted,
              isNext && styles.badgeNext,
              item.state === "upcoming" && styles.badgeUpcoming,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.state === "upcoming" && styles.badgeTextUpcoming,
              ]}
            >
              {item.badge}
            </Text>
          </View>
        </View>
        <View style={styles.timelineSubRow}>
          {isNext && (
            <Feather
              name="clock"
              size={12}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
};

const SectionCard = ({ section }) => {
  const [open, setOpen] = useState(section.defaultOpen);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
      >
        <View style={styles.sectionNumberCircle}>
          <Text style={styles.sectionNumberText}>{section.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionStatus}>
            {section.status} · {section.doneLabel}
          </Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.sectionBody}>
          {section.items.map((item, idx) => (
            <RoadmapItem
              key={item.id}
              item={item}
              isLast={idx === section.items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("1");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome card */}
        {/* <View style={styles.welcomeCard}>
          <View style={styles.welcomeLeft}>
            <View>
              <Image
                source={{ uri: "https://i.pravatar.cc/100?img=47" }}
                style={styles.welcomeAvatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.welcomeName}>Alex Chen</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.scanButton} activeOpacity={0.8}>
            <Feather name="file-text" size={14} color="#0F5132" />
            <Text style={styles.scanButtonText}>Scan Syllabus</Text>
          </TouchableOpacity>
        </View> */}

        {/* Active Syllabus */}
        <TouchableOpacity style={styles.syllabusCard} activeOpacity={0.8}>
          <View style={styles.syllabusIconBox}>
            <MaterialCommunityIcons
              name="crop-square"
              size={20}
              color="#16A673"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.syllabusLabel}>Active Syllabus</Text>
            <Text style={styles.syllabusTitle} numberOfLines={1}>
              CS 201: Data Structures & Algorith...
            </Text>
          </View>
          <Feather name="chevrons-up" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View>
              <Text style={styles.progressLabel}>Term Progression</Text>
              <View style={styles.progressPctRow}>
                <Text style={styles.progressPct}>68%</Text>
                <Text style={styles.progressPctLabel}>Completed</Text>
              </View>
            </View>
            <View style={styles.progressRing}>
              <MaterialIcons name="settings" size={18} color="#16A673" />
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: "68%" }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Feather name="check-square" size={16} color="#16A673" />
              <Text style={styles.statValue}>24 / 35</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.statBox}>
              <Feather name="calendar" size={16} color="#16A673" />
              <Text style={styles.statValue}>8 Days</Text>
              <Text style={styles.statLabel}>Midterm</Text>
            </View>
            <View style={styles.statBox}>
              <Feather name="droplet" size={16} color="#F59E0B" />
              <Text style={styles.statValue}>5 Days</Text>
              <Text style={styles.statLabel}>Streak 🔥</Text>
            </View>
          </View>
        </View>

        {/* Filter pills */}
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = item.id === activeFilter;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id)}
                style={[styles.pill, active && styles.pillActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Topic sections */}
        {SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}

        {/* Add topic */}
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Feather name="plus-circle" size={18} color="#16A673" />
          <Text style={styles.addButtonText}>Add Topic / Custom Note</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom tab bar */}
      {/* <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <View key={tab.id} style={styles.tabItem}>
            <Feather
              name={tab.icon}
              size={20}
              color={tab.active ? "#16A673" : "#9CA3AF"}
            />
            <Text style={tab.active ? styles.tabLabelActive : styles.tabLabel}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View> */}
    </SafeAreaView>
  );
};

export default Index;

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },




  // welcomeCard: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   marginTop: 12,
  //   marginBottom: 14,
  // },
  // welcomeLeft: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   flexShrink: 1,
  // },
  // welcomeAvatar: {
  //   width: 48,
  //   height: 48,
  //   borderRadius: 24,
  // },
  // onlineDot: {
  //   position: "absolute",
  //   bottom: 0,
  //   right: 0,
  //   width: 12,
  //   height: 12,
  //   borderRadius: 6,
  //   backgroundColor: "#22C55E",
  //   borderWidth: 2,
  //   borderColor: "#F5F7FA",
  // },
  // welcomeLabel: {
  //   fontSize: 11,
  //   fontWeight: "700",
  //   color: "#9CA3AF",
  //   letterSpacing: 0.5,
  // },
  // welcomeName: {
  //   fontSize: 20,
  //   fontWeight: "700",
  //   color: "#111827",
  // },
  // scanButton: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 6,
  //   backgroundColor: "#D8F3E4",
  //   paddingHorizontal: 14,
  //   paddingVertical: 10,
  //   borderRadius: 20,
  // },
  // scanButtonText: {
  //   fontSize: 13,
  //   fontWeight: "600",
  //   color: GREEN_DARK,
  // },

  // Active syllabus
  syllabusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  syllabusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E6F7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  syllabusLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  syllabusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  // Progress card
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  progressPctRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  progressPct: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  progressPctLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  // Filter pills
  filterList: {
    paddingBottom: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: GREEN_DARK,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },

  // Section card
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  sectionNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: GREEN_DARK,
  },
  sectionStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: GREEN,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Timeline items
  timelineRow: {
    flexDirection: "row",
  },
  timelineTrack: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: {
    backgroundColor: GREEN,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#D1FAE5",
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 18,
    marginLeft: 10,
  },
  timelineContentNext: {
    backgroundColor: "#F0FDF6",
    borderRadius: 12,
    padding: 10,
    marginLeft: 10,
    marginBottom: 4,
  },
  timelineTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  itemTitleCompleted: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  timelineSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  badgeCompleted: {
    backgroundColor: "#DCFCE7",
  },
  badgeNext: {
    backgroundColor: GREEN,
  },
  badgeUpcoming: {
    backgroundColor: "#F3F4F6",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  badgeTextUpcoming: {
    color: "#6B7280",
  },

  // Add topic
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: GREEN,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  tabLabelActive: {
    fontSize: 11,
    color: GREEN,
    fontWeight: "700",
  },
});