import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GREEN = "#16A673";

const HomeHeader = () => {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoBox}>
            <Feather name="check-square" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>Curricula</Text>
        </View>
        <View style={styles.topBarRight}>
          <Feather
            name="bell"
            size={20}
            color="#111827"
            style={{ marginRight: 14 }}
          />
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=47" }}
            style={styles.topAvatar}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  // Top bar
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
  topAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
  },
});
