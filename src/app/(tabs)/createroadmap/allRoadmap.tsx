import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Syllabus } from "../../../../types/roadmapTypes";
import RoadmapCard from "@/components/ui/RoadmapCard";
import { useRouter } from "expo-router";

export default function allRoadmap() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function showALLRoadmap() {
      setLoading(true);
      setError(null);
      try {
        const cookie = await authClient.getCookie();
        const headers = new Headers();
        headers.append("Cookie", cookie ?? "");

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
        // console.log("roadmap", data.syllabus[0].subjects);
        if (!cancelled) setSyllabusList(data.syllabus ?? []);
      } catch (error) {
        console.log("Error", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    showALLRoadmap();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function redirect() {
    if (syllabusList.length > 0) {
      router.push("..");
    }
  }
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text>{error}</Text>
      </SafeAreaView>
    );
  }

  if (syllabusList.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text>No roadmap found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {syllabusList.map((syllabus) => (
          <RoadmapCard
            key={syllabus.id}
            syllabus={syllabus}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/createroadmap/[id]",
                params: {
                  id: syllabus.id,
                },
              })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor:"red"
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: 32,
  },
  indent: {
    paddingLeft: 12,
  },
  subTopic: {
    paddingVertical: 4,
  },
});

// <Collapsible title={s.name} key={s.id}>
//       <View style={styles.indent}>
//         {s.subjects.map((sub) => (
//           <Collapsible title={sub.name} key={sub.id}>
//             <View style={styles.indent}>
//               {sub.units.map((unit) => (
//                 <Collapsible title={unit.name} key={unit.id}>
//                   <View style={styles.indent}>
//                     {unit.topics.map((topic) => (
//                       <Collapsible title={topic.name} key={topic.id}>
//                         <View style={styles.indent}>
//                           {topic.subTopics.map((subT) => (
//                             <Text key={subT.id} style={styles.subTopic}>
//                               . {subT.name}
//                             </Text>
//                           ))}
//                         </View>
//                       </Collapsible>
//                     ))}
//                   </View>
//                 </Collapsible>
//               ))}
//             </View>
//           </Collapsible>
//         ))}
//       </View>
//     </Collapsible>
