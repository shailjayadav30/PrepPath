import {  View } from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});
export default function SocialSignIn() {
  const handleGoogleSignIn = async () => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response) && response.data.idToken) {
      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: { token: response.data.idToken },
        callbackURL: "/dashboard",
      });
      if (!error) {
        router.replace("/");
      }
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <GoogleSigninButton onPress={handleGoogleSignIn} />
    </View>
  );
}
