import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Collapsible } from "@/components/ui/collapsible";

type SubTopic = {
  id: string;
  name: string;
};

type Topic = {
  id: string;
  name: string;
  subTopics: SubTopic[];
};
type Unit = {
  id: string;
  name: string;
  topics: Topic[];
};
type Subject = {
  id: string;
  name: string;
  units: Unit[];
};

type Syllabus = {
  id: string;
  name: string;
  subjects: Subject[];
};

export default function allRoadmap() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [expanded, setExpanded] = useState(false);
  async function showALLRoadmap() {
    if (!userId) return;
    const cookie = await authClient.getCookie();
    console.log("cookie:", cookie);

    const headers = new Headers();
    headers.append("Cookie", cookie ?? "");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/syllabus`,
        {
          method: "GET",
          headers,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error in getting roadmaps: ${errorText}`);
      }
      const data = await response.json();
      console.log("roadmap", data.syllabus[0].subjects);
      setSyllabusList(data.syllabus || []);
    } catch (error) {
      console.log("Error", error);
    }
  }

  useEffect(() => {
    if (session?.user) {
      showALLRoadmap();
    }
  }, [session]);

  return (
    <SafeAreaView style={styles.container}>
      <Collapsible title="roadmap">
        {syllabusList.map((s) => (
          <TouchableOpacity key={s.id}>
            <Text>{s.name}</Text>
            <View>
              {s.subjects.map((sub) => (
                <View key={sub.id}>
                  <Text>{sub.name}</Text>
                  <View>
                    {sub.units.map((unit) => (
                      <View key={unit.id}>
                        <Text>{unit.name}</Text>
                        <View>
                          {unit.topics.map((topic) => (
                            <View key={topic.id}>
                              <Text>{topic.name}</Text>
                              <View>
                                {topic.subTopics.map((subT) => (
                                  <View key={subT.id}>
                                    <Text>{subT.name}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ))}
                          x``
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </Collapsible>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "red",
    padding: 10,
  },
});
