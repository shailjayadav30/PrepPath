import { authClient } from "@/lib/auth-client";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getInitials } from "../../../types/roadmapTypes";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";

const HomeHeader = () => {
  const { data: session } = authClient.useSession();

  const initials = getInitials(session?.user.name);
  const image = session?.user.image || undefined;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        {/* Left */}
        <View style={styles.topBarLeft}>
          <View style={styles.logoBox}>
            <Feather name="check-square" size={18} color="#FFFFFF" />
          </View>

          <Text style={styles.brand}>Shinro</Text>
        </View>

        {/* Right */}
        <View style={styles.topBarRight}>
          <Feather name="bell" size={20} color="#111827" style={styles.bell} />

          <View style={styles.avatar}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : initials ? (
              <Text style={styles.initials}>{initials}</Text>
            ) : (
              <Ionicons name="person" size={19} color={GREEN} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },

  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  bell: {
    marginRight: 14,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F5EF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontSize: 16,
    color: GREEN_DARK,
    fontWeight: "700",
  },
});
