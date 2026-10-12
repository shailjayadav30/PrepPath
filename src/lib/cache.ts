import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";

// Last-loaded screen data kept on the device, so screens show it instantly on launch
// while fresh data loads. Keyed per user so accounts never see each other's data.
const PREFIX = "cache:v1:";

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown) {
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

// Loads the cached value once per key and hands it to `onCached` (unless fresh data
// already arrived, which `hasFresh` reports)
export function useCachedValue<T>(
  key: string | null,
  onCached: (value: T) => void,
  hasFresh: () => boolean,
) {
  const latest = useRef({ onCached, hasFresh });
  latest.current = { onCached, hasFresh };

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    readCache<T>(key).then((value) => {
      if (!cancelled && value && !latest.current.hasFresh()) latest.current.onCached(value);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
}
