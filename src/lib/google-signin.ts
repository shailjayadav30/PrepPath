import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Call once at app start. webClientId must be the same web client ID the
// backend uses for Google, so the backend accepts the returned idToken.
// Android is matched by package name + SHA-1 in Google Cloud Console.
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

// Clears the cached Google account so the account picker shows next time.
export async function signOutOfGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google; nothing to clear.
  }
}
