// Development-only logging. In release builds (the APK) nothing is written, so errors
// and any data they carry never reach the device log (logcat), which other tools on
// the phone can read. Never log users, tokens or cookies, even in development.
export const logger = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error(...args);
  },
};
