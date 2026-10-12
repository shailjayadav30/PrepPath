import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

type NativeModule = {
  requestPermissionAsync(): Promise<{ granted?: boolean } | null>;
  show(title: string, elapsedSeconds: number, running: boolean): void;
  hide(): void;
};

// Android-only native module (an APK/dev build). In Expo Go, on iOS and on web it's
// missing, and every call below does nothing.
const native =
  Platform.OS === "android"
    ? requireOptionalNativeModule<NativeModule>("StudyTimerNotification")
    : null;

export const timerNotification = {
  available: native !== null,

  async requestPermission() {
    if (!native) return false;
    try {
      const result = await native.requestPermissionAsync();
      return !!result?.granted;
    } catch {
      return false;
    }
  },

  // Ongoing notification with a ticking clock (running) or the time so far (paused)
  show(title: string, elapsedSeconds: number, running: boolean) {
    try {
      native?.show(title, Math.max(0, Math.floor(elapsedSeconds)), running);
    } catch (err) {
      console.warn("Couldn't show the study timer notification:", err);
    }
  },

  hide() {
    try {
      native?.hide();
    } catch {}
  },
};
