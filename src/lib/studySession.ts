import { apiJson } from "@/lib/api";
import type {
  EndSessionResponse,
  ProgressData,
  StudySession,
} from "../../types/roadmapTypes";

// Device time zone, so the server counts study days (and streaks) in local time
export function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

type SessionResponse = { session: StudySession };

export const studyApi = {
  active: () => apiJson<{ session: StudySession | null }>("/study-sessions/active"),
  start: (roadmapId: string) =>
    apiJson<SessionResponse>("/study-sessions", { method: "POST", body: { roadmapId } }),
  pause: (id: string) =>
    apiJson<SessionResponse>(`/study-sessions/${id}/pause`, { method: "POST" }),
  resume: (id: string) =>
    apiJson<SessionResponse>(`/study-sessions/${id}/resume`, { method: "POST" }),
  end: (id: string) =>
    apiJson<EndSessionResponse>(`/study-sessions/${id}/end`, {
      method: "POST",
      body: { timeZone: deviceTimeZone() },
    }),
  discard: (id: string) => apiJson(`/study-sessions/${id}`, { method: "DELETE" }),
  progress: (days = 7) =>
    apiJson<ProgressData>(
      `/progress?days=${days}&timeZone=${encodeURIComponent(deviceTimeZone())}`,
    ),
};

// 2715 -> "00:45:15"
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// 3900 -> "1h 05m", 2700 -> "45m", 40 -> "40s"
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
