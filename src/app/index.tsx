import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "@/lib/auth-client";

export default function Index() {
  const { data: session, isPending } = authClient.useSession();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasOnboarded").then((value) => {
      setHasOnboarded(value === "true");
    });
  }, []);

  //   const checkAsyncStorage = async () => {
  //   try {
  //     const keys = await AsyncStorage.getAllKeys();
  //     console.log('AsyncStorage Keys:', keys);

  //     if (keys.length > 0) {
  //       const results = await AsyncStorage.multiGet(keys);
  //       console.log('AsyncStorage Content:', Object.fromEntries(results));
  //     } else {
  //       console.log('AsyncStorage is empty.');
  //     }
  //   } catch (error) {
  //     console.error('Error inspecting AsyncStorage:', error);
  //   }
  // };

  // useEffect(()=>{
  // checkAsyncStorage()
  // },[])
  if (isPending || hasOnboarded === null) {
    return null;
  }

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}
