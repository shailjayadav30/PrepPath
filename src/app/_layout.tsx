import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, Text, StyleSheet } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        {/* <Stack.Screen name="index" /> */}
        {/* <Stack.Screen name="(onboarding)" options={{headerShown:false}}/> */}
        <Stack.Screen name="(auth)" options={{headerShown:false}} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "red",
  },
});
