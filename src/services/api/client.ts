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
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // A FormData body must set its own Content-Type, because the header has to
  // carry the multipart boundary that fetch generates. Forcing
  // application/json here would make the server reject the upload.
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
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
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: body?.message ?? "Request failed",
        data: body?.data ?? (null as T),
        errors: body?.errors,
      };
    }
    return body;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out. Check your connection and try again."
          : "Check your connection and try again.",
      data: null as T,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function formDataRequest<T>(
  path: string,
  body: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method, body });
}

// Same as apiRequest, plus the signed-in user's bearer token - for
// endpoints behind the backend's auth guard (seller, profile, etc).
export async function authedApiRequest<T>(
  path: string,
  options: RequestInit = {},
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

export async function authedFormDataRequest<T>(
  path: string,
  body: FormData,
  method: "POST" | "PATCH" = "PATCH",
): Promise<ApiResponse<T>> {
  const session = await readStoredSession();
  return apiRequest<T>(path, {
    method,
    headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body,
  });
}
