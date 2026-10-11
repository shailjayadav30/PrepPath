import { authClient } from "@/lib/auth-client";
import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getInitials } from "../../../types/roadmapTypes";

const logo = require("../../../assets/images/icon.png");

const HomeHeader = () => {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const initials = getInitials(session?.user.name);
  const image = session?.user.image || undefined;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        {/* Left */}
        <View style={styles.topBarLeft}>
          <Image source={logo} style={styles.logo} contentFit="cover" />
          <Text style={styles.brand}>Shinro</Text>
        </View>

        {/* Right */}
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : initials ? (
            <Text style={styles.initials}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={19} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },

  brand: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryTint,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontSize: 15,
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
