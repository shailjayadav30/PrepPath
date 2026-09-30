import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getInitials } from "../../../types/roadmapTypes";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const GREEN_TINT = "#E8F6F1";
const MUTED = "#7A837F";
const DANGER = "#D64545";

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  onChange?: (uri: string | null) => void;
};



export default function ImagePickerExample({
  uri,
  name,
  size = 112,
  onChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<string | null>(uri ?? null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setImage(uri ?? null);
  }, [uri]);

  const update = (value: string | null) => {
    setImage(value);
    onChange?.(value);
  };

  // Close the sheet first, then launch the picker (iOS dislikes stacked modals)
  const run = (action: () => Promise<void>) => {
    setOpen(false);
    setTimeout(action, 250);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) update(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access in your phone settings to take a profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) update(result.assets[0].uri);
  };

  const removePhoto = async () => update(null);

  const initials = getInitials(name);
  const badge = Math.round(size * 0.3);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          { width: size, height: size },
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.ring,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : initials ? (
            <Text style={[styles.initials, { fontSize: size * 0.34 }]}>
              {initials}
            </Text>
          ) : (
            <Ionicons name="person" size={size * 0.45} color={GREEN} />
          )}
        </View>

        <View
          style={[
            styles.badge,
            { width: badge, height: badge, borderRadius: badge / 2 },
          ]}
        >
          <Ionicons name="camera" size={badge * 0.52} color="#fff" />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Profile photo</Text>

          <SheetOption
            icon="images-outline"
            label="Choose from gallery"
            onPress={() => run(pickFromGallery)}
          />
          <SheetOption
            icon="camera-outline"
            label="Take a photo"
            onPress={() => run(takePhoto)}
          />
          {image && (
            <SheetOption
              icon="trash-outline"
              label="Remove photo"
              danger
              onPress={() => run(removePhoto)}
            />
          )}

          <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function SheetOption({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
    >
      <View
        style={[
          styles.optionIcon,
          danger && { backgroundColor: "#FDECEC" },
        ]}
      >
        <Ionicons name={icon} size={20} color={danger ? DANGER : GREEN} />
      </View>
      <Text style={[styles.optionText, danger && { color: DANGER }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  ring: {
    backgroundColor: GREEN_TINT,
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  initials: { color: GREEN_DARK, fontWeight: "700" },

  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: GREEN,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  backdrop: { flex: 1, backgroundColor: "rgba(15,81,50,0.35)" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DDE7E2",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: GREEN_DARK,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optionPressed: { backgroundColor: "#F3FAF7" },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 16, fontWeight: "500", color: "#17201C" },
  cancel: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F3F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: MUTED },
});