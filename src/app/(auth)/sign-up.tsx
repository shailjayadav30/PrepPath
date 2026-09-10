import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SocialSignIn from "@/components/social-sign-in";
export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const handleSignup = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      console.log("Signup error:", error);
      return;
    }

    console.log("User:", data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Feather name="check-square" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Curricula</Text>
          <Text style={styles.subtitle}>
            Master your syllabus, step by step
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* username */}

              <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={styles.labelWithIcon}>
                <Feather name="lock" size={14} color="#374151" />
                <Text style={styles.labelText}>UserName</Text>
              </View>
             
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="john"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
        
            </View>
          </View>
          {/* email */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={styles.labelWithIcon}>
                <Feather name="briefcase" size={14} color="#374151" />
                <Text style={styles.labelText}>Student Email </Text>
              </View>
            </View>
            <TextInput
              placeholder="e.g. alex.chen@university.edu"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={styles.labelWithIcon}>
                <Feather name="lock" size={14} color="#374151" />
                <Text style={styles.labelText}>Password</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>
  
          {/* Sign In button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignup}
            activeOpacity={0.85}
          >
            <Text style={styles.signInButtonText}>Sign up</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social row */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              {/* <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.socialButtonText}>Google</Text> */}
              <SocialSignIn />
            </TouchableOpacity>
          </View>

          {/* Sign up */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Allready have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)")}>
              <Text style={styles.signUpLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#16A673",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Form
  form: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A673",
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
  },

  // Checkbox row
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#16A673",
    borderColor: "#16A673",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Sign in button
  signInButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#16A673",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },

  // SSO button
  ssoButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  ssoButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  // Social row
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  // Footer
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
  },
  signUpText: {
    fontSize: 13,
    color: "#6B7280",
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A673",
  },
});
