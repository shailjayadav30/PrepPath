import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authClient } from "@/lib/auth-client";
import { getGoogleSignIn } from "@/lib/google-signin";

// Renders nothing where Google sign-in can't run (Expo Go); see lib/google-signin
export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const google = getGoogleSignIn();
  if (!google) return null;
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  const handlePress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();

      // User closed the account picker.
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error("Google did not return an ID token");
      }

      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: { token: idToken },
      });
      if (error) {
        throw new Error(error.message || "Server rejected the Google sign-in");
      }
      // On success the session updates and Stack.Protected opens the tabs.
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (
          err.code === statusCodes.SIGN_IN_CANCELLED ||
          err.code === statusCodes.IN_PROGRESS
        ) {
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            "Google Play Services needed",
            "Update or enable Google Play Services to sign in with Google.",
          );
          return;
        }
      }
      console.error("Google sign-in failed:", err);
      Alert.alert(
        "Couldn't sign in with Google",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
    >
      {loading ? (
        <ActivityIndicator color="#EA4335" />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.text}>Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
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
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
