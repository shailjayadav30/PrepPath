import HomeHeader from "@/components/header/homeHeader";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import StudySessionProvider from "@/components/study/StudySessionProvider";
import StudyTimerPill from "@/components/study/StudyTimerPill";

// Room for the icon and label, above the system navigation area. The default (49 + inset)
// clips labels on phones with larger text/display size settings.
const TAB_CONTENT_HEIGHT = 58;

export default function TabseLayout() {
  const insets = useSafeAreaInsets();
  // Gesture-navigation phones can report no bottom inset; keep labels off the screen edge
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    // One study session shared by every tab (timer card, capsule and background notification)
    <StudySessionProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              height: TAB_CONTENT_HEIGHT + bottomPad,
              paddingTop: 6,
              paddingBottom: bottomPad,
            },
            tabBarItemStyle: { paddingVertical: 2 },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
            sceneStyle: { backgroundColor: colors.bg },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              header: () => <HomeHeader />,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(createroadmap)"
            options={{
              title: "Roadmap",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "map" : "map-outline"} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="progress"
            options={{
              title: "Progress",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "stats-chart" : "stats-chart-outline"}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "settings" : "settings-outline"}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>

        {/* Floating running-timer capsule: starts at the top, draggable, kept above the tab bar */}
        <StudyTimerPill bottomInset={TAB_CONTENT_HEIGHT + bottomPad} />
      </View>
    </StudySessionProvider>
  );
}
