import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Syllabus } from "../../../types/roadmapTypes";
import { StyleSheet } from "react-native";
type Prop = {
  syllabus: Syllabus;
  onPress: () => void;
};

export default function RoadmapCard({ syllabus, onPress }: Prop) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <View>
          <Text>{syllabus.name}</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "green",
  },
});
