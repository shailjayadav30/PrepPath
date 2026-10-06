import { Alert } from "react-native";

export const confirmDelete = (label: string, onConfirm: () => void) =>
  Alert.alert("Delete", `Delete "${label}"? This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
