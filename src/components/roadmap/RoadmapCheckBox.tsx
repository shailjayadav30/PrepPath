import { Pressable, StyleSheet, Text, View } from "react-native";
import { RoadmapCheckBoxProps } from "../../../types/roadmapTypes";
import { Ionicons } from "@expo/vector-icons";

export default function RoadmapCheckBox({
  onPress,
  size = 22,
  checked,
}: RoadmapCheckBoxProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.checkbox,
        {
          width: size,
          height: size,
          borderRadius: 6,
        },
        checked && styles.checked,
      ]}
    >
      {checked && <Ionicons name="checkmark" size={size - 5} color="#FFFFFF" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 1.5,
    borderColor: "#B8C4BD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  checked: {
    backgroundColor: "#16A673",
    borderColor: "#16A673",
  },
});
