import AvatarPicker from "@/components/ui/ImagePicker";
import NameModal from "@/components/ui/NameModal";
import { apiJson, errorMessage, uploadFile } from "@/lib/api";
import type { ImagePickerAsset } from "expo-image-picker";
// import { useOnboarding } from "@/components/OnboardingProvider";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const GREEN_TINT = "#E8F6F1";
const MUTED = "#7A837F";
const DANGER = "#D64545";

type IconName = keyof typeof Ionicons.glyphMap;

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#E8F6F1" }}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && { backgroundColor: "#F7FBF9" },
      ]}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: "#FDECEC" }]}>
        <Ionicons name={icon} size={20} color={danger ? DANGER : GREEN} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: DANGER }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {!danger && <Ionicons name="chevron-forward" size={20} color="#B2BBB7" />}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// Matches the server's limit (Vercel rejects larger request bodies)
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const Settings = () => {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;
  // Shown while the new photo uploads, so the change is visible right away
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  // const { resetOnboarding } = useOnboarding();

  const uploadPhoto = async (asset: ImagePickerAsset) => {
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      Alert.alert("Photo too large", "Please choose a photo smaller than 4 MB.");
      return;
    }
    setPreview(asset.uri);
    setPhotoBusy(true);
    try {
      await uploadFile("/profile/avatar", "avatar", {
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
        file: asset.file,
      });
      // The session holds the user's image; reload it so every screen updates
      await refetch();
    } catch (err) {
      console.error("Error uploading photo:", err);
      Alert.alert("Couldn't update photo", errorMessage(err, "Please try again."));
    } finally {
      setPreview(null);
      setPhotoBusy(false);
    }
  };

  const removePhoto = () =>
    Alert.alert("Remove photo", "Remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setPhotoBusy(true);
          try {
            await apiJson("/profile/avatar", { method: "DELETE" });
            await refetch();
          } catch (err) {
            Alert.alert("Couldn't remove photo", errorMessage(err, "Please try again."));
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);

  const saveName = async (name: string) => {
    try {
      await apiJson("/profile", { method: "PATCH", body: { name } });
      await refetch();
      setEditingName(false);
    } catch (err) {
      Alert.alert("Couldn't update name", errorMessage(err, "Please try again."));
    }
  };
  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
        },
      },
    ]);
  };

  const soon = (what: string) => () =>
    Alert.alert(what, "This screen is coming soon.");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile and preferences</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <AvatarPicker
            uri={preview ?? user?.image ?? null}
            name={user?.name}
            busy={photoBusy}
            onPick={uploadPhoto}
            onRemove={removePhoto}
          />
          <Pressable
            style={styles.nameRow}
            onPress={() => setEditingName(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit name"
          >
            <Text style={styles.profileName}>{user?.name ?? "Your Profile"}</Text>
            <View style={styles.editIcon}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
            </View>
          </Pressable>
          {user?.email ? (
            <Text style={styles.profileEmail}>{user.email}</Text>
          ) : null}
          <Text style={styles.profileHint}>Tap the photo or your name to change them</Text>
        </View>

        <NameModal
          visible={editingName}
          title="Edit name"
          message="This is how your name appears in the app."
          placeholder="Your name"
          initialValue={user?.name ?? ""}
          submitLabel="Save"
          onSubmit={saveName}
          onClose={() => setEditingName(false)}
        />

        <Section title="Account">
          <Row icon="person-outline" label="Edit name" value={user?.name} onPress={() => setEditingName(true)} />
          <Row icon="notifications-outline" label="Notifications" onPress={soon("Notifications")} />
          <Row icon="lock-closed-outline" label="Privacy & Security" onPress={soon("Privacy & Security")} last />
        </Section>

        <Section title="Support">
          <Row icon="help-circle-outline" label="Help & Support" onPress={soon("Help & Support")} />
          <Row icon="information-circle-outline" label="About" onPress={soon("About")} last />
        </Section>

        <Section title="Session">
          <Row icon="log-out-outline" label="Sign out" danger onPress={handleSignOut} last />
        </Section>

        {/* {__DEV__ && (
          <Section title="Developer">
            <Row icon="refresh-outline" label="Reset onboarding" onPress={resetOnboarding} last />
          </Section>
        )} */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { marginTop: 12, marginBottom: 22 },
  title: { fontSize: 28, fontWeight: "800", color: GREEN_DARK },
  subtitle: { marginTop: 4, fontSize: 14, color: MUTED },

  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 26,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#E4F1EC",
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 20,
  },
  profileName: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#17201C",
  },
  editIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  profileEmail: { marginTop: 3, fontSize: 14, color: MUTED },
  profileHint: { marginTop: 10, fontSize: 12, color: colors.textMuted },

  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4F1EC",
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#EEF5F1" },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: "#25302B" },
  rowValue: { maxWidth: "45%", fontSize: 14, color: MUTED },
});