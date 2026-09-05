import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{headerShown:false}}/>
      <Stack.Screen name="sign-up" options={{headerShown:false}}/>
    </Stack>
  );
}
