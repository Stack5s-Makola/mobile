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




export const sendData = async (payload: any) => {
  try {
    const response = await fetch(
      "https://makola-backend-r9wy.onrender.com/api/register/seller",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error sending data to backend:", error);
    throw error;
  }
};
