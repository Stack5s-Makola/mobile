import { ApiResponse } from "@types/api";
import { readStoredSession } from "@services/session";

// Placeholder base client. Wire this to the real NestJS backend
// (Render) once Promise's User/Seller endpoints are live. Until then,
// screens should import from src/services/mocks instead.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// Same as apiRequest, plus the signed-in user's bearer token - for
// endpoints behind the backend's auth guard (seller, profile, etc).
export async function authedApiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const session = await readStoredSession();
  return apiRequest<T>(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body,
  });
  return res.json();
}
