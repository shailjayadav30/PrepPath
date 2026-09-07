import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, Text, StyleSheet } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useEffect } from "react";
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
   useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        {/* <Stack.Screen name="index" /> */}
        {/* <Stack.Screen name="(onboarding)" options={{headerShown:false}}/> */}
        <Stack.Screen name="(auth)" options={{headerShown:false}} />
        <Stack.Screen name="(tabs)" options={{headerShown:false}} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "red",
  },
});
