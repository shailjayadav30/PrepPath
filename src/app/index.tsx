import { Redirect } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { useOnboarding } from "@/components/OnboardingProvider";

export default function Index() {
  const { hasOnboarded } = useOnboarding();
  const { data: session } = authClient.useSession();

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}
