import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import { authClient } from "@/lib/auth-client";
import { colors, radius } from "@/lib/theme";
import { DialogHost } from "@/components/ui/AppDialog";
import OnboardingProvider, {
  useOnboarding,
} from "@/components/OnboardingProvider";
import { configureGoogleSignIn } from "@/lib/google-signin";

SplashScreen.preventAutoHideAsync();
configureGoogleSignIn();

export default function RootLayout() {
  //

  return (
    // Gesture root: toasts can be swiped away
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingProvider>
        <RootNavigator />
      </OnboardingProvider>
      {/* App-wide feedback: toasts for messages, themed dialogs and menus for choices */}
      <Toaster
        position="top-center"
        theme="light"
        toastOptions={{
          style: {
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
          titleStyle: { color: colors.text, fontWeight: "700" },
          descriptionStyle: { color: colors.textSecondary },
        }}
      />
      <DialogHost />
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { hasOnboarded } = useOnboarding();
  const { data: session, isPending } = authClient.useSession();
  // The session saved on the device is enough to open the app; the server check keeps
  // running and signs the user out if it's no longer valid. Only signed-out users wait.
  const isReady = hasOnboarded !== null && (!isPending || !!session);
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
