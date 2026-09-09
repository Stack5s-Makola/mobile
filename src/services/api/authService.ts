import { ApiResponse } from "@types/api";
import {
  RegisterPayload,
  RegisterResult,
  VerifyOtpPayload,
  VerifyOtpResult,
  SelectRolePayload,
} from "@types/auth";
import { apiRequest } from "./client";

// Real backend calls. Same function names/signatures as
// src/services/mocks/authService.ts on purpose - swapping the import in
// a screen is the only change needed once Promise's endpoints are live.

export function register(payload: RegisterPayload): Promise<ApiResponse<RegisterResult>> {
  return apiRequest<RegisterResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResult>> {
  return apiRequest<VerifyOtpResult>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function selectRole(
  payload: SelectRolePayload
): Promise<ApiResponse<{ userId: string; role: string }>> {
  return apiRequest("/api/users/role", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
