import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, AppState } from "react-native";
import { ApiError, errorMessage } from "@/lib/api";
import { studyApi } from "@/lib/studySession";
import SessionSummary from "./SessionSummary";
import { timerNotification } from "../../../modules/study-timer-notification";
import type { EndSessionResponse, StudySession } from "../../../types/roadmapTypes";

// Matches the server: shorter sessions aren't saved
const MIN_SESSION_SECONDS = 60;

type StudySessionState = {
  // The open (running or paused) session, or null
  session: StudySession | null;
  loaded: boolean;
  busy: boolean;
  // Date.now() when `session` arrived; session.elapsedSeconds is as of then
  receivedAt: number;
  refresh: () => Promise<void>;
  start: (roadmapId: string) => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  discard: () => void;
};

const StudySessionContext = createContext<StudySessionState | null>(null);

// `now` is passed in (not read inside) so the React Compiler sees it change every second
const elapsedAt = (session: StudySession, receivedAt: number, now: number) =>
  session.elapsedSeconds + (session.running ? (now - receivedAt) / 1000 : 0);

const elapsedNow = (session: StudySession, receivedAt: number) =>
  elapsedAt(session, receivedAt, Date.now());

// One study session for the whole app: the subject screen's timer, the pill above the
// tabs, and the notification while the app is in the background all read it from here.
export default function StudySessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<EndSessionResponse | null>(null);
  // Latest values for the AppState listener
  const latest = useRef({ session, receivedAt });
  latest.current = { session, receivedAt };

  const apply = useCallback((next: StudySession | null) => {
    setReceivedAt(Date.now());
    setSession(next);
    if (!next) timerNotification.hide();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { session } = await studyApi.active();
      apply(session);
    } catch (err) {
      console.warn("Couldn't load the study session:", err);
    } finally {
      setLoaded(true);
    }
  }, [apply]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Leaving the app: show the timer as a notification. Coming back: hide it (the pill and
  // the subject screen show it) and resync with the server.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      const { session, receivedAt } = latest.current;
      if (state === "background") {
        if (session) {
          timerNotification.show(
            session.roadmapName,
            elapsedNow(session, receivedAt),
            session.running,
          );
        }
      } else if (state === "active") {
        timerNotification.hide();
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const act = async (fn: () => Promise<void>, failTitle: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      Alert.alert(failTitle, errorMessage(err, "Please try again."));
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const start = (roadmapId: string) =>
    act(async () => {
      apply((await studyApi.start(roadmapId)).session);
      // Asked once; Android 13+ needs it for the timer notification
      timerNotification.requestPermission();
    }, "Couldn't start the timer");

  const pause = () =>
    act(async () => apply((await studyApi.pause(session!.id)).session), "Couldn't pause");

  const resume = () =>
    act(async () => apply((await studyApi.resume(session!.id)).session), "Couldn't resume");

  const discardNow = () =>
    act(async () => {
      await studyApi.discard(session!.id);
      apply(null);
    }, "Couldn't discard the session");

  // Started and stopped by accident: nothing to save, so offer to keep going or discard
  const tooShort = () =>
    Alert.alert(
      "Too short to save",
      "Sessions under 1 minute aren't saved. Keep studying, or discard this one. Anything you ticked stays ticked on the roadmap.",
      [
        { text: "Keep studying", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: discardNow },
      ],
    );

  const end = () => {
    if (!session) return;
    if (elapsedNow(session, receivedAt) < MIN_SESSION_SECONDS) {
      tooShort();
      return;
    }
    act(async () => {
      try {
        const result = await studyApi.end(session.id);
        apply(null);
        setSummary(result);
      } catch (err) {
        // The server's clock decides; it can disagree by a second or two
        if (err instanceof ApiError && err.status === 422) {
          tooShort();
          return;
        }
        throw err;
      }
    }, "Couldn't end the session");
  };

  const discard = () =>
    Alert.alert(
      "Discard session?",
      "This session's time won't be saved. Anything you ticked stays ticked on the roadmap.",
      [
        { text: "Keep studying", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: discardNow },
      ],
    );

  return (
    <StudySessionContext.Provider
      value={{ session, loaded, busy, receivedAt, refresh, start, pause, resume, end, discard }}
    >
      {children}
      <SessionSummary result={summary} onClose={() => setSummary(null)} />
    </StudySessionContext.Provider>
  );
}

export function useStudySession() {
  const ctx = useContext(StudySessionContext);
  if (!ctx) throw new Error("useStudySession must be used inside StudySessionProvider");
  return ctx;
}

// Seconds studied, ticking every second while the session runs. Each component that shows
// the clock uses this, so only it re-renders every second (not the whole app).
export function useStudyClock() {
  const { session, receivedAt } = useStudySession();
  // The current time lives in state: the React Compiler caches values whose inputs don't
  // change, so a Date.now() read during render would freeze the clock
  const [now, setNow] = useState(() => Date.now());
  const running = !!session?.running;

  useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, receivedAt]);

  return session ? elapsedAt(session, receivedAt, Math.max(now, receivedAt)) : 0;
}
