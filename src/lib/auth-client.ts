import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_BASE_URL, 
  plugins: [
    expoClient({
        scheme: "studyfrontend",
      //  cookiePrefix: "better-auth",
      storagePrefix: "studyfrontend",
      storage: SecureStore,
    }),
  ],
});
