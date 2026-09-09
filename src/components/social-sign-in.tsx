// import {  View } from "react-native";
// import { router } from "expo-router";
// import {
//   GoogleSignin,
//   GoogleSigninButton,
//   isSuccessResponse,
// } from "@react-native-google-signin/google-signin";
// import { authClient } from "@/lib/auth-client";
// GoogleSignin.configure({
//   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//   iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
// });
// export default function SocialSignIn() {
//   const handleGoogleSignIn = async () => {
//     try {
//       await GoogleSignin.hasPlayServices();
//       const response = await GoogleSignin.signIn();
//       if (isSuccessResponse(response) && response.data.idToken) {
//         const { error } = await authClient.signIn.social({
//           provider: "google",
//           idToken: { token: response.data.idToken },
//           callbackURL: "/dashboard",
//         });
//         if (!error) {
//           router.replace("/");
//         } else {
//           console.error("Sign-in error:", error);
//         }
//       }
//     } catch (error) {
//       console.error("Google sign-in failed:", error);
//     }
//   };
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <GoogleSigninButton onPress={handleGoogleSignIn} />
//       {/* <Button title="login" /> */}
//     </View>
//   );
// }

import { StyleSheet, Text, View } from 'react-native'


const SocialSignin = () => {
  return (
    <View>
      <Text>social-sign-in</Text>
    </View>
  )
}

export default SocialSignin

const styles = StyleSheet.create({})