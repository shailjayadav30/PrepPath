import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Roadmap tab: spaces list -> space -> add roadmap / roadmap detail
export default function RoadmapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="space/[spaceId]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="allRoadmap" />
      <Stack.Screen name="pdf" />
    </Stack>
  );
}
