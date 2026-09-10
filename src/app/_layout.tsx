// import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useColorScheme, Text, StyleSheet } from "react-native";

// // import { AnimatedSplashOverlay } from "@/components/animated-icon";
// // import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import { useEffect} from "react";
// import { authClient } from "@/lib/auth-client";
// SplashScreen.preventAutoHideAsync();

// export default function TabLayout() {

//   const { data: session, isPending } = authClient.useSession();
//   const colorScheme = useColorScheme();
//    const isLoggedIn = !!session;
//    useEffect(() => {
//     if (!isPending) {
//       SplashScreen.hideAsync();
//     }
//   }, [isPending]);

//   if (isPending) {
//     return null;
//   }

//   //  useEffect(() => {
//   //   GoogleSignin.configure({
//   //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//   //     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
//   //   });
//   // }, []);
//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       {/* <AnimatedSplashOverlay /> */}
//       <Stack>
//         {/* <Stack.Screen name="index" /> */}
//         {/* <Stack.Screen name="(onboarding)" options={{headerShown:false}}/> */}
//         <Stack.Protected guard={!isLoggedIn}>
//           <Stack.Screen name="sign-in" options={{ headerShown: false }} />
//           <Stack.Screen name="sign-up" options={{ headerShown: false }} />
//         </Stack.Protected>
//         <Stack.Protected guard={isLoggedIn}>
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         </Stack.Protected>
//       </Stack>
//     </ThemeProvider>
//   );
// }

// const styles = StyleSheet.create({
//   text: {
//     color: "red",
//   },
// });

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "@/lib/auth-client";
import ErrorBoundary from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const colorScheme = useColorScheme();
  const isLoggedIn = !!session;

  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasOnboarded").then((value) => {
      setHasOnboarded(value === "true");
    });
  }, []);

  const isReady = !isPending && hasOnboarded !== null;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* <ErrorBoundary> */}
      {/* <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />

          <Stack.Protected guard={!hasOnboarded}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>

          <Stack.Protected guard={!!hasOnboarded && !isLoggedIn}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
          </Stack.Protected>

          <Stack.Protected guard={!!hasOnboarded && isLoggedIn}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
        </Stack> */}
      {/* </ErrorBoundary> */}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />

        <Stack.Screen name="(onboarding)" />

        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />

        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
