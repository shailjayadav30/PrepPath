import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useOnboarding } from "@/components/OnboardingProvider";

export default function Onboarding2() {
  const { completeOnboarding } = useOnboarding();

  const finishOnboarding = async () => {
    try {
      await completeOnboarding();
    } catch (err) {
      console.error("Error saving onboarding status:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Illustration */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.iconCircle}>
            <Feather name="map" size={48} color="#FFFFFF" />
          </View>
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Get Your Roadmap</Text>
          <Text style={styles.subtitle}>
            We'll break your syllabus down into units, topics, and subtopics
            — so you always know exactly what to study next.
          </Text>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* Get started button */}
        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.85}
          onPress={finishOnboarding}
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 24 },

  illustrationWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#16A673",
    alignItems: "center",
    justifyContent: "center",
  },

  textBlock: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#16A673",
  },

  nextButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#16A673",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  nextButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});