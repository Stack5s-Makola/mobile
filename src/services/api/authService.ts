import { ApiResponse } from "@types/api";
import {
  RegisterPayload,
  RegisterResult,
  VerifyOtpPayload,
  VerifyOtpResult,
  SelectRolePayload,
  BuyerProfilePayload,
  SellerProfilePayload,
  AuthSessionResult,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@types/auth";
import { UserRole } from "@types/user";
import { apiRequest } from "./client";
import { RegisterSellerPayload, RegisterSellerResult } from "@types/auth";

// // Real backend calls. Same function names/signatures as
// // src/services/mocks/authService.ts on purpose - swap the import in each
// // screen once Promise's auth endpoints are live, no other changes needed.

// export function register(payload: RegisterPayload): Promise<ApiResponse<RegisterResult>> {
//   return apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
// }

// export function verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResult>> {
//   return apiRequest("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) });
// }

// export function resendOtp(userId: string): Promise<ApiResponse<{ sent: boolean }>> {
//   return apiRequest("/api/auth/resend-otp", { method: "POST", body: JSON.stringify({ userId }) });
// }

// export function selectRole(
//   payload: SelectRolePayload
// ): Promise<ApiResponse<{ role: UserRole }>> {
//   return apiRequest("/api/auth/select-role", { method: "POST", body: JSON.stringify(payload) });
// }

// export function completeBuyerProfile(
//   payload: BuyerProfilePayload
// ): Promise<ApiResponse<AuthSessionResult>> {
//   return apiRequest("/api/auth/buyer-profile", { method: "POST", body: JSON.stringify(payload) });
// }

// export function completeSellerProfile(
//   payload: SellerProfilePayload
// ): Promise<ApiResponse<AuthSessionResult>> {
//   return apiRequest("/api/auth/seller-profile", { method: "POST", body: JSON.stringify(payload) });
// }

// const sendData = async (payload: any) => {
//   const response = await fetch("https://makola-backend-r9wy.onrender.com/api/register/seller", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await response.json();

//   return data;
// };

// export function login(payload: LoginPayload): Promise<ApiResponse<AuthSessionResult>> {
//   return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
// }

// export function forgotPassword(
//   payload: ForgotPasswordPayload
// ): Promise<ApiResponse<{ userId: string }>> {
//   return apiRequest("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) });
// }

// export function resetPassword(
//   payload: ResetPasswordPayload
// ): Promise<ApiResponse<{ success: true }>> {
//   return apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify(payload) });
// }


// POST /api/register/set-seller-profile - creates the account AND emails a
// 6-digit code, in one call. Contract confirmed by probing the live backend:
//
//   wire field   <- our field        notes
//   email        <- email
//   phone        <- phone            9-15 digits, optional leading +
//   password     <- password         min 8 characters
//   name         <- fullName         max 120 chars
//   shopName     <- businessName     max 120 chars, must be globally unique
//   location     <- location         object of { latitude, longitude }
//   role         <- (constant)       "SELLER"
//
// Returns { saved: true } and nothing else - no userId - so the OTP step has
// to identify the account by email.
//
// 409s to expect, message only (no `errors` map):
//   "An account with that phone number already exists"
//   "An account with this email already exists"
//   "That shop name is already taken"
//
// NOTE: photoUri is absent from the contract. The endpoint accepts the
// request without it and ignores it if sent, so the seller's photo is not
// uploaded yet.
export function registerSeller(
  payload: RegisterSellerPayload
): Promise<ApiResponse<RegisterSellerResult>> {
  return apiRequest("/api/register/set-seller-profile", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
      name: payload.fullName.trim(),
      shopName: payload.businessName.trim(),
      location: payload.location,
      role: "SELLER",
    }),
  });
}

// POST /api/otp - (re)sends a verification code to an email address.
export function sendOtp(email: string): Promise<ApiResponse<unknown>> {
  return apiRequest("/api/otp", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}
