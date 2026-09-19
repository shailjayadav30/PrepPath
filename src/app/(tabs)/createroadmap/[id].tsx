import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Syllabus } from "../../../../types/roadmapTypes";

export default function roadmap() {
  const { id } = useLocalSearchParams();
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  async function getCompleteRoadmap(id: string) {
    try {
      const cookie = await authClient.getCookie();
      console.log("cookie",cookie)
      const headers = new Headers();
      headers.append("Cookie", cookie ?? "");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/syllabus/${id}`,
        {
          method: "GET",
          headers,
        },
      );
      console.log("Response", response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error in getting roadmap:${errorText}`);
      }

      const data = await response.json();
      console.log("API RESPONSE",data.syllabus)
      setSyllabusList(data.syllabus ??[]);
    } catch (error) {}
  }

  useEffect(() => {
    getCompleteRoadmap(id);
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <Text>roadmaps {id}</Text>
      <View>
        {syllabusList.map((s) => (
          <Text key={s.id}>{s.name}</Text>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "red",
    flex: 1,
  },
});
