import { Stack } from "expo-router";

export default function RoadmapLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          headerShown: true,
          title: `Roadmap: ${(route.params as { id?: string } | undefined)?.id ?? "Detail"}`,
        })}
      />

      <Stack.Screen
        name="allRoadmap"
        options={() => ({
          headerShown: false,
        })}
      />
    </Stack>
  );
}
