import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import { getInitials } from "../../../types/roadmapTypes";

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  // Shows a spinner over the photo (e.g. while it uploads)
  busy?: boolean;
  onPick: (asset: ImagePicker.ImagePickerAsset) => void;
  onRemove?: () => void;
};

// Profile photo with a sheet to pick from the gallery, take a photo, or remove it.
// Controlled: the parent uploads the picked image and passes the new `uri`.
export default function AvatarPicker({
  uri,
  name,
  size = 112,
  busy,
  onPick,
  onRemove,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  // Close the sheet first, then launch the picker (iOS dislikes stacked modals)
  const run = (action: () => void | Promise<void>) => {
    setOpen(false);
    setTimeout(action, 250);
  };

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    // Keeps uploads small; the server crops to 512x512 anyway
    quality: 0.6,
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) onPick(result.assets[0]);
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
    const result = await ImagePicker.launchCameraAsync(options);
    if (!result.canceled) onPick(result.assets[0]);
  };

  const initials = getInitials(name);
  const badge = Math.round(size * 0.3);

  return (
    <>
      <Pressable
        onPress={() => !busy && setOpen(true)}
        style={({ pressed }) => [{ width: size, height: size }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
      >
        <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} />
          ) : initials ? (
            <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={size * 0.45} color={colors.primary} />
          )}
          {busy && (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}
        </View>

        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Ionicons name="camera" size={badge * 0.52} color={colors.white} />
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
          <SheetOption icon="camera-outline" label="Take a photo" onPress={() => run(takePhoto)} />
          {uri && onRemove && (
            <SheetOption
              icon="trash-outline"
              label="Remove photo"
              danger
              onPress={() => run(onRemove)}
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
      <View style={[styles.optionIcon, danger && { backgroundColor: colors.dangerTint }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.optionText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  ring: {
    backgroundColor: colors.primaryTint,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  initials: { color: colors.primaryDark, fontWeight: "700" },
  busy: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 81, 50, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  backdrop: { flex: 1, backgroundColor: "rgba(15,81,50,0.35)" },
  sheet: {
    backgroundColor: colors.card,
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
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.primaryDark, marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optionPressed: { backgroundColor: colors.primarySoft },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 16, fontWeight: "500", color: colors.text },
  cancel: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F3F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
});
