import { View, Text } from "react-native";
import { useState, createContext, PropsWithChildren, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
const KEY = "hasOnboarded";

type OnboardingState = {
  hasOnboarded: boolean | null;
  completeOnboarding: () => Promise<void>;
};

const onboardingContext = createContext<OnboardingState | null>(null);
export default function OnboardingProvider({ children }: PropsWithChildren) {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((value) => {
        setHasOnboarded(value === "true");
      })
      .catch(() => setHasOnboarded(false));
  }, []);

  const completeOnboarding = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(KEY, "true");
  };
  return (
    <onboardingContext.Provider value={{ hasOnboarded, completeOnboarding }}>
      {children}
    </onboardingContext.Provider>
  );
}

export function useOnboarding(){
    const ctx=useContext(onboardingContext)
    if(!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider")
        return ctx

}