import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
  plugins: [
    expoClient({
      scheme: "studyfrontend",
      //  cookiePrefix: "better-auth",
      storagePrefix: "studyfrontend",
      storage: SecureStore,
    }),
  ],
});
