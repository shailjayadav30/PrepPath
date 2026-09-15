import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function roadmap() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>roadmap {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
