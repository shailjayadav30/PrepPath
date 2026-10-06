import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import OnboardingProvider, {
  useOnboarding,
} from "@/components/OnboardingProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  //

  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

function RootNavigator() {
  const { hasOnboarded } = useOnboarding();
  const { data: session, isPending } = authClient.useSession();
  const isReady = !isPending && hasOnboarded !== null;
  const colorScheme = useColorScheme();
  const isLoggedIn = !!session;

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
      <Stack screenOptions={{ headerShown: false }}>
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
      </Stack>
    </ThemeProvider>
  );
}
