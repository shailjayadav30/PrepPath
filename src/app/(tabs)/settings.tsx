import ImagePickerExample from "@/components/ui/ImagePicker";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const Settings = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [photo, setPhoto] = useState<string | null>(user?.image ?? null);
const router=useRouter()
  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
        router.replace("/(auth)/login") 
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
          <ImagePickerExample
            uri={photo}
            name={user?.name}
            onChange={(uri) => {
              setPhoto(uri);
              // TODO: upload uri to your backend and save the image URL
            }}
          />
          <Text style={styles.profileName}>{user?.name ?? "Your Profile"}</Text>
          {user?.email ? (
            <Text style={styles.profileEmail}>{user.email}</Text>
          ) : null}
        </View>

        <Section title="Account">
          <Row icon="person-outline" label="Account Settings" onPress={soon("Account Settings")} />
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
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
  profileName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    color: "#17201C",
  },
  profileEmail: { marginTop: 3, fontSize: 14, color: MUTED },

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
  rowValue: { fontSize: 14, color: MUTED },
});