import { authClient } from "@/lib/auth-client";
import type { DocumentPickerAsset } from "expo-document-picker";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// Carries the HTTP status so callers can react to e.g. 410 (expired upload)
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const failure = (status: number, body: any) =>
  new ApiError(body?.message ?? `Server responded with ${status}`, status);

// JSON request to /api with the session cookie; throws the backend's message on failure
export async function apiJson<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const cookie = await authClient.getCookie();
  const hasBody = init.body !== undefined;
  const response = await fetch(`${BASE_URL}/api${path}`, {
    method: init.method ?? "GET",
    headers: {
      Cookie: cookie ?? "",
      ...(hasBody && { "Content-Type": "application/json" }),
    },
    ...(hasBody && { body: JSON.stringify(init.body) }),
    credentials: "include",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw failure(response.status, data);
  return data as T;
}

// Multipart upload of a picked PDF as form field "pdffile" (what multer expects)
export async function uploadPdf<T>(
  path: string,
  file: DocumentPickerAsset,
): Promise<T> {
  const url = `${BASE_URL}/api${path}`;

  if (Platform.OS === "web") {
    if (!file.file) throw new Error("No file blob available for web upload");
    const formData = new FormData();
    formData.append("pdffile", file.file, file.name);
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw failure(res.status, data);
    return data as T;
  }

  // XHR on native: fetch doesn't reliably send the Cookie header with multipart bodies
  const cookies = await authClient.getCookie();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (cookies) xhr.setRequestHeader("Cookie", cookies);
    xhr.withCredentials = true;

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        if (data) resolve(data as T);
        else reject(new Error("Invalid response from server"));
      } else {
        reject(failure(xhr.status, data));
      }
    };
    xhr.onerror = () => reject(new Error("Network request failed"));

    const formData = new FormData();
    formData.append("pdffile", {
      uri: file.uri,
      name: file.name || "syllabus.pdf",
      type: file.mimeType || "application/pdf",
    } as any);
    xhr.send(formData);
  });
}

// Backend messages are written for users; transport errors get the fallback
export function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError && !err.message.startsWith("Server responded")) {
    return err.message;
  }
  if (err instanceof Error && err.message === "Network request failed") {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return fallback;
}
