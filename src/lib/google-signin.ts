import { TurboModuleRegistry } from "react-native";

// Google sign-in needs its native module, which APK/dev builds include but Expo Go
// doesn't. Importing the library without it crashes the app at startup, so it's only
// loaded when the native module exists; in Expo Go Google sign-in is simply hidden.
export const isGoogleSignInAvailable = TurboModuleRegistry.get("RNGoogleSignin") != null;

type GoogleSignInLib = typeof import("@react-native-google-signin/google-signin");

let lib: GoogleSignInLib | null = null;

// The library, or null where it can't run (Expo Go, web)
export function getGoogleSignIn(): GoogleSignInLib | null {
  if (!isGoogleSignInAvailable) return null;
  if (!lib) {
    // Loaded lazily (not a top-level import) so Expo Go never evaluates it
    lib = require("@react-native-google-signin/google-signin") as GoogleSignInLib;
  }
  return lib;
}

// Call once at app start. webClientId must be the same web client ID the
// backend uses for Google, so the backend accepts the returned idToken.
// Android is matched by package name + SHA-1 in Google Cloud Console.
export function configureGoogleSignIn() {
  getGoogleSignIn()?.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

// Clears the cached Google account so the account picker shows next time.
export async function signOutOfGoogle() {
  try {
    await getGoogleSignIn()?.GoogleSignin.signOut();
  } catch {
    // Not signed in with Google; nothing to clear.
  }
}
