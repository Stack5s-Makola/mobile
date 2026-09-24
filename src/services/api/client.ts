import { ApiResponse } from "@types/api";
import { readStoredSession } from "@services/session";

// Placeholder base client. Wire this to the real NestJS backend
// (Render) once Promise's User/Seller endpoints are live. Until then,
// screens should import from src/services/mocks instead.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Without this, a request made with no connection can hang for a minute or
// more before the platform gives up - long enough that "you're offline" never
// appears. Uploads get longer: they're slow even on a good connection.
const REQUEST_TIMEOUT_MS = 12_000;
const UPLOAD_TIMEOUT_MS = 60_000;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // A FormData body must set its own Content-Type, because the header has to
  // carry the multipart boundary that fetch generates. Forcing
  // application/json here would make the server reject the upload.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  );

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Same as apiRequest, plus the signed-in user's bearer token - for
// endpoints behind the backend's auth guard (seller, profile, etc).
export async function authedApiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const session = await readStoredSession();
  // Leave Content-Type to apiRequest, which omits it for FormData so fetch can
  // set the multipart boundary itself. Hardcoding JSON here would break uploads.
  return apiRequest<T>(path, {
    ...options,
    headers: {
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
