				

# Code Review: Shinro (studyfrontend)

Reviewed: every file under `src/`, `types/`, plus `app.json`, `package.json`, `tsconfig.json`, `eas.json`, `.gitignore`.
Branch: `googleauth`.
`npx tsc --noEmit` passes.

Fixes are grouped by priority. Each item lists the file, the problem, and the fix.

---

## 1. Bugs (fix first)

### 1.4 Roadmap detail screen spins forever on error

**File:** [src/app/(tabs)/(createroadmap)/[id].tsx:13-23](src/app/(tabs)/(createroadmap)/[id].tsx#L13-L23)

No `try/catch`, no `res.ok` check, no error state. If the request fails (network, 404, expired session), `roadmap` stays `null` and the spinner never stops. There's also an unhandled promise rejection.
**Fix:** add `error` state, check `res.ok`, show an error and a retry button, and ignore the result after unmount (like `allRoadmap.tsx` does with `cancelled`).

### 1.5 Completion progress is never saved

**File:** [src/app/(tabs)/(createroadmap)/[id].tsx:223-237](src/app/(tabs)/(createroadmap)/[id].tsx#L223-L237)

Checking units, topics, and subtopics only updates local state (three `TODO: PATCH` comments). Progress is lost when the user leaves the screen. This is the app's main feature.
**Fix:** call the PATCH endpoints. Update the UI first, then roll back and show an error if the request fails.

### 1.6 Sign-out goes to a route that doesn't exist

**File:** [src/app/(tabs)/settings.tsx:81](src/app/(tabs)/settings.tsx#L81)

`router.replace("/(auth)/login")`: there is no `(auth)` group or `login` route.
**Fix:** delete the line. Once the session is cleared, `Stack.Protected` in the root layout redirects to `sign-in` on its own.

### 1.7 "Sign in" link on the sign-up page goes to the wrong screen

**File:** [src/app/sign-up.tsx:156](src/app/sign-up.tsx#L156)

`router.push("/(tabs)")` should be `router.replace("/sign-in")` (or `router.back()`).

### 1.8 Home screen can stay stuck on loading

**File:** [src/app/(tabs)/index.tsx:32-56](src/app/(tabs)/index.tsx#L32-L56)

If `userId` is undefined, `getRoadmap` returns before `finally`, so `loading` stays `true`. A failed fetch only logs to the console, and the user sees "No roadmap yet", which is misleading.
**Fix:** set `loading=false` on the early return, add an error state, and show an error message.

### 1.9 Home list doesn't refresh after creating or deleting a roadmap

**Files:** [src/app/(tabs)/index.tsx](src/app/(tabs)/index.tsx), [src/app/(tabs)/(createroadmap)/allRoadmap.tsx](src/app/(tabs)/(createroadmap)/allRoadmap.tsx)

Data loads once on mount, and tabs stay mounted. A newly created roadmap won't appear on Home until the user pulls to refresh.
**Fix:** refetch with `useFocusEffect` from `expo-router`, or (better, see 2.2) use TanStack Query and invalidate the query after create or delete.

### 1.10 Profile photo is never saved

**Files:** [src/app/(tabs)/settings.tsx:71](src/app/(tabs)/settings.tsx#L71), [src/components/ui/ImagePicker.tsx](src/components/ui/ImagePicker.tsx)

- The picked photo lives only in local `useState`. It isn't uploaded or saved to the user record, so it's lost on restart.
- `useState(user?.image ?? null)` only reads the session once. If the session loads after the first render, the photo stays `null`.

**Fix:** upload the image and call `authClient.updateUser({ image })`. Read the photo straight from `session.user.image` instead of copying it into state.

---

## 2. Architecture and code organization

### 2.1 Put all API calls in one helper

The same pattern (`authClient.getCookie()` → `fetch(\`${process.env.EXPO_PUBLIC_BASE_URL}/api/...\`, { headers: { Cookie } })`→ manual`ok`check) is copied in **7 places** across`index.tsx`, `allRoadmap.tsx`, `[id].tsx`, and `(createroadmap)/index.tsx`, and each copy handles errors differently.

Create `src/lib/api.ts`:

```ts
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
if (!BASE_URL) throw new Error("EXPO_PUBLIC_BASE_URL is not set");

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = await authClient.getCookie();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: Platform.OS === "web" ? "include" : "omit",
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...init.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? `Request failed (${res.status})`);
  return body as T;
}
```

Then add typed functions on top: `getFollowingRoadmaps()`, `getRoadmap(id)`, `deleteUnit(id)`, and so on.
(Note: browsers don't allow setting a `Cookie` header, so on web you need `credentials: "include"`, as the upload code already does.)

### 2.2 Use a data-fetching library

Every screen manages `loading` / `error` / `refreshing` / `cancelled` by hand. **TanStack Query** (`@tanstack/react-query`) gives you caching, refetch on focus, retries, optimistic updates (for 1.5), and invalidation (for 1.9), and removes most of that boilerplate.

### 2.4 Move `types/` into `src/` (or add an alias)

`types/` is outside `src/`, but `@/*` only points to `./src/*`, so files import `../../../../types/roadmapTypes`. Move it to `src/types/` and import `@/types/roadmap`.
Also:

- `getInitials` is a utility, not a type. Move it to `src/lib/utils.ts`.
- Component prop types (`TopicCardProps`, `SubTopicItemProps`, …) belong next to their components.

### 2.5 Centralize colors and theme

Every screen redefines `GREEN`, `GREEN_DARK`, `GREEN_TINT`, `MUTED`, `DANGER`, and `MUTED` has **4 different values** (`#5F6F68`, `#7A837F`, `#6B7A73`, `#789083`).
**Fix:** create `src/constants/theme.ts` with one palette (light + dark) and import it everywhere.

### 2.6 Dark mode is half-enabled

`app.json` has `"userInterfaceStyle": "automatic"`, and the root layout switches to `DarkTheme`, but every screen hardcodes a white background and dark text. In dark mode the tab bar and navigation turn dark while the content stays white.
**Fix:** either set `"userInterfaceStyle": "light"` for now, or use theme colors (2.5) on every screen.

### 2.7 Reuse shared UI pieces

- [sign-in.tsx](src/app/sign-in.tsx) and [sign-up.tsx](src/app/sign-up.tsx) have **identical ~200-line StyleSheets**, including unused styles (`checkbox*`, `ssoButton*`). Extract `AuthHeader`, `FormField`, `PasswordInput`, and `PrimaryButton` components.
- The two onboarding screens also duplicate their styles. Use one `OnboardingSlide` component, or one screen with a horizontal pager.

### 2.8 Smaller component cleanups

- [RoadmapViw.tsx](src/components/roadmap/RoadmapViw.tsx): fix the filename typo (`RoadmapView.tsx`). `UnitCard({ unit, props })` passes the whole props object as a prop named `props`; pass only the callbacks it needs.
- [ImagePicker.tsx](src/components/ui/ImagePicker.tsx): rename `ImagePickerExample` → `AvatarPicker`. Copying the `uri` prop into state with `useEffect` is a known anti-pattern; use the prop directly (controlled component). The `setTimeout(action, 250)` modal workaround is fragile; use the Modal's `onDismiss` (iOS) or start the picker after the close animation.
- Use `expo-image`'s `Image` everywhere (`ImagePicker.tsx` uses the React Native `Image`, while `homeHeader.tsx` uses `expo-image`).
- [(createroadmap)/_layout.tsx:10-13](src/app/(tabs)/(createroadmap)/_layout.tsx#L10-L13): `title` is computed but `headerShown: false`, so it never shows. Remove it.

---

## 3. TypeScript and type safety

### 3.2 Remove `any`

[(createroadmap)/index.tsx](src/app/(tabs)/(createroadmap)/index.tsx) uses `any` for `roadmap`, `units`, topics, subtopics, the upload response, and `catch (err: any)`. Use the `Roadmap` type (and a `GenerateRoadmapResponse` type). In `catch`, use `err instanceof Error ? err.message : ...`.
The preview also handles `typeof s === "string" ? s : s.name`, a sign the API response shape isn't defined. Agree on one shape with the backend and type it.

### 3.3 Make API response keys consistent

- `GET /api/roadmap/isfollowing` → `data.roadmaps`
- `GET /api/roadmap` → `data.roadmap` (an array, singular name)
- `GET /api/roadmap/:id` → `data.roadmap`

Fix the naming on the backend, or at least type each response so a mistake is a compile error.

### 3.4 Avoid non-null assertions

In `[id].tsx`, `find(...)!` and `value!` will crash if an id goes stale (for example after a delete). Handle `undefined`.

### 3.5 Make sure typed routes work

`experiments.typedRoutes` is on, yet `router.replace("/(auth)/login")` (1.6) passed `tsc`. Run `npx expo start` once (or `npx expo customize tsconfig.json`) so `.expo/types` is generated, then re-run `tsc`. It should catch invalid hrefs.

### 3.6 Don't import Expo Router internals

[sign-in.tsx:14](src/app/sign-in.tsx#L14): `import { Button } from "expo-router/build/react-navigation"`. This is an internal path that can break on any update, and it's unused. Remove it. Line 15 also imports `router` and then shadows it with `const router = useRouter()`.

---

## 4. Dead code to delete

| File                                                                                                                                               | Why                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `UnitCardProps`, `TopicCardProps`, `SubTopicItemProps`, `RoadmapSectionHeaderProps`, `RoadmapCheckBoxProps` in `types/roadmapTypes.ts` | The components that used them have been deleted                                            |
| `src/components/social-sign-in.tsx`                                                                                                              | Placeholder that renders the text "social-sign-in" inside the sign-up page's Google button |
| `.github/modernize/java-upgrade/`                                                                                                                | Unrelated leftover from a VS Code Java extension                                           |
| Large commented-out blocks in`sign-up.tsx`, `social-sign-in.tsx`, `[id].tsx`, `RoadmapViw.tsx`                                             | Git keeps the history; delete them                                                         |

Also: `ErrorBoundary.tsx` exists but is commented out. Either use it (see 6.3) or use Expo Router's built-in `export function ErrorBoundary` in `_layout.tsx`.

---

## 5. Auth screens: UX and correctness

- **No loading or double-submit protection** on Sign In / Sign Up. Add `isSubmitting`, disable the button, and show a spinner.
- **No input validation.** Check for an empty email, an invalid email format, and a minimum password length before calling the API.
- **Placeholder buttons that do nothing:** "Forgot password?" (on both pages, and it makes no sense on sign-up), the Google button on sign-in, and the bell icon in `HomeHeader`. Hide them until they work.
- **Sign-up label icon:** "UserName" uses the `lock` icon. Use `user`. The label should be "Name" (better-auth's `name` is a display name, not a username).
- **Sign-in label** says "Email or Username", but only `signIn.email` is called. Change it to "Email".
- **Typos:** "loogging", "Allready", `TabseLayout`.
- **Keyboard covers inputs** on small screens. Wrap the form in `KeyboardAvoidingView` / `ScrollView` with `keyboardShouldPersistTaps="handled"`.
- Add `textContentType` / `autoComplete` (`email`, `password`, `new-password`, `name`) so password managers and autofill work.

---

## 6. Security and logging

### 6.1 Remove `console.log` of sensitive data

- `sign-in.tsx:34` logs `data` (user and session token) on every login.
- `sign-up.tsx:31,36` logs the full error and user object.
- Overall there are 18 `console.*` calls across the screens. Remove them, or wrap them in `if (__DEV__)` / a small logger.

### 6.2 Don't show raw errors to users

`sign-up.tsx:32` shows `Alert.alert(..., JSON.stringify(error))`, which displays raw JSON. Show `error.message`, or map known error codes to friendly text.

### 6.3 Hide stack traces in production

`ErrorBoundary.tsx` renders `error.stack` to the user. Show it only `if (__DEV__)`, and show a friendly "Something went wrong" + retry in production.

### 6.4 Environment variables

- `EXPO_PUBLIC_*` values are bundled into the app in plain text. Fine for the base URL, but never put secrets there.
- Check `EXPO_PUBLIC_BASE_URL` once at startup (see 2.1). Today, if it's missing, requests silently go to `"undefined/api/..."`.
- Add a committed `.env.example` that lists the required variables.

### 6.5 Upload hardening

[(createroadmap)/index.tsx:72-109](src/app/(tabs)/(createroadmap)/index.tsx#L72-L109): set `xhr.timeout` (for example 120s) and `xhr.ontimeout`, since generation "can take up to a minute". Consider aborting the request on unmount. The web branch shows a generic error and drops the server's `message`, unlike the native branch.

---

## 7. Performance and lists

- [allRoadmap.tsx](src/app/(tabs)/(createroadmap)/allRoadmap.tsx) renders a `ScrollView` + `.map()`. Use `FlatList` (as Home does) and add pull-to-refresh.
- The roadmap preview in `(createroadmap)/index.tsx` uses array indexes as React keys. Use `unit.id` / `topic.id` if the API returns them.
- `RoadmapCard` nests `TouchableOpacity`s (the delete button sits inside the card's touchable), so taps can trigger both. Use `Pressable` and lay the buttons out side by side, or stop the event from bubbling.
- `RoadmapCard` has a hardcoded `progress = 68`. Compute it from the roadmap data (reuse `isTopicDone` from `RoadmapViw.tsx`), or have the backend return it.
- `reactCompiler: true` is on, so don't add manual `useMemo`/`useCallback` everywhere. Keep components pure so the compiler can optimize them (the `useState(prop)` + `useEffect` sync in `ImagePicker` works against this).

---

## 8. Accessibility

- Icon-only buttons (delete trash, chevrons, eye toggle, `+` add button, avatar picker) have no `accessibilityLabel`. Screen readers say "button".
- `Checkbox` in `RoadmapViw.tsx` is missing `accessibilityRole="checkbox"` and `accessibilityState={{ checked }}` (the unused `RoadmapCheckBox.tsx` had them).
- Text colors like `#9CA3AF` on white are below WCAG AA contrast for body text. Use them only for placeholders.
- Add `hitSlop` or make small targets at least 44×44.

---

## 9. Project config and tooling

- **ESLint is not set up.** `npm run lint` (`expo lint`) will prompt to install. Run `npx expo lint` once to create `eslint.config.js` with `eslint-config-expo`, and include `eslint-plugin-react-hooks` / React Compiler rules.
- **Add Prettier** (code style is inconsistent: mixed quotes, indentation, missing semicolons in `settings.tsx`, `social-sign-in.tsx`).
- **Add scripts:** `"typecheck": "tsc --noEmit"`, and run `lint` + `typecheck` in CI or a pre-commit hook (husky + lint-staged).
- **Tests:** there are none. Start with the pure helpers (`isTopicDone`, `isUnitDone`, the `setDone` reducer logic) using `jest-expo`, then `@testing-library/react-native` for the auth screens.
- **Dependency ranges:** `expo-secure-store` uses `^57.0.1`, while other Expo packages use `~`. Use `~` so `npx expo install --check` controls the version. Run `npx expo install --check` / `npx expo-doctor` regularly.
- **`app.json`:**
  - The `expo-image-picker` `photosPermission` text ("share them with your friends") doesn't describe what the app does. Change it to "…set your profile photo". Add a `cameraPermission` string too, since the app uses the camera.
  - `scheme` / `slug` / bundle id are still `studyfrontend` while the app is "Shinro". Decide before the first store release (bundle ids can't change after publishing).
  - `extra.router: {}` is empty; remove it.
- **`.vscode/settings.json`:** `"source.sortMembers"` reorders class members on save, which creates noisy diffs. Consider removing it.
- **`.gitignore`:** fine. `.env` is correctly ignored, and `/ios` + `/android` are ignored (CNG). Keep it that way and use config plugins instead of editing native code.

---

## Suggested order of work

1. Bugs 1.4 – 1.7 (quick fixes; 1.4 can leave users stuck on a spinner).
2. Delete the remaining dead code (section 4).
3. Add `src/lib/api.ts` (2.1), then TanStack Query (2.2). This fixes 1.4, 1.8, 1.9 almost automatically.
4. Save progress (1.5) with optimistic updates.
5. Theme/colors + shared auth components (2.5 – 2.7).
6. ESLint + Prettier + typecheck + first tests (section 9).
7. Accessibility and auth UX polish (sections 5, 8).
