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
import { RegisterSellerPayload, RegisterSellerResult } from "@types/auth";

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Any 6-digit code works against this fixed mock OTP - logged to the
// console (both for registration and forgot-password) for convenience.
const MOCK_OTP = "123456";

type PendingUser = {
  id: string;
  phone: string;
  email: string;
  password: string;
  verified: boolean;
  role?: UserRole;
  fullName?: string;
  location?: string;
  businessName?: string;
  photoUri?: string;
};

// In-memory "database" for this mock. Resets every time Metro restarts.
const usersByPhone = new Map<string, PendingUser>();
let nextId = 1;

function findById(userId: string) {
  return [...usersByPhone.values()].find((u) => u.id === userId);
}

export async function register(
  payload: RegisterPayload
): Promise<ApiResponse<RegisterResult>> {
  const id = `mock-${nextId++}`;
  usersByPhone.set(payload.phone, {
    id,
    phone: payload.phone,
    email: payload.email,
    password: payload.password,
    verified: false,
  });
  console.log(`[mock authService] OTP for ${payload.phone}: ${MOCK_OTP}`);
  return delay({
    success: true,
    message: "OTP sent",
    data: { userId: id, phone: payload.phone },
  });
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<VerifyOtpResult>> {
  const user = findById(payload.userId);
  if (!user) {
    return delay({ success: false, message: "User not found", data: null as never });
  }
  if (payload.code !== MOCK_OTP) {
    return delay({ success: false, message: "Invalid code. Try again.", data: null as never });
  }
  user.verified = true;
  return delay({
    success: true,
    message: "Verified",
    data: { userId: user.id, phone: user.phone, email: user.email, verified: true },
  });
}

export async function resendOtp(userId: string): Promise<ApiResponse<{ sent: boolean }>> {
  console.log(`[mock authService] OTP resent: ${MOCK_OTP}`);
  return delay({ success: true, message: "OTP resent", data: { sent: true } });
}

export async function selectRole(
  payload: SelectRolePayload
): Promise<ApiResponse<{ role: UserRole }>> {
  const user = findById(payload.userId);
  if (user) user.role = payload.role;
  return delay({ success: true, message: "Role set", data: { role: payload.role } });
}

export async function completeBuyerProfile(
  payload: BuyerProfilePayload
): Promise<ApiResponse<AuthSessionResult>> {
  const user = findById(payload.userId);
  if (!user || !user.role) {
    return delay({
      success: false,
      message: "Complete role selection first",
      data: null as never,
    });
  }
  user.fullName = payload.fullName;
  user.location = payload.location;
  return delay({
    success: true,
    message: "Profile complete",
    data: {
      accessToken: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      location: user.location,
    },
  });
}

export async function completeSellerProfile(
  payload: SellerProfilePayload
): Promise<ApiResponse<AuthSessionResult>> {
  const user = findById(payload.userId);
  if (!user || !user.role) {
    return delay({
      success: false,
      message: "Complete role selection first",
      data: null as never,
    });
  }
  user.fullName = payload.fullName;
  user.location = payload.location;
  user.businessName = payload.businessName;
  user.photoUri = payload.photoUri;
  return delay({
    success: true,
    message: "Profile complete",
    data: {
      accessToken: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      location: user.location,
      businessName: user.businessName,
      photoUri: user.photoUri,
    },
  });
}

// Mock counterpart to the combined POST /api/register/set-seller-profile.
// Creates the account AND marks it role=SELLER with profile fields all at
// once, matching the real endpoint's one-shot behavior.
export async function registerSeller(
  payload: RegisterSellerPayload
): Promise<ApiResponse<RegisterSellerResult>> {
  const id = `mock-${nextId++}`;
  usersByPhone.set(payload.phone, {
    id,
    phone: payload.phone,
    email: payload.email,
    password: payload.password,
    verified: false,
    role: "SELLER",
    fullName: payload.fullName,
    businessName: payload.businessName,
    location: payload.location,
    photoUri: payload.photoUri,
  });
  console.log(`[mock authService] OTP for ${payload.phone}: ${MOCK_OTP}`);
  return delay({
    success: true,
    message: "Account created",
    data: { userId: id, phone: payload.phone },
  });
}

export async function login(payload: LoginPayload): Promise<ApiResponse<AuthSessionResult>> {
  const user = usersByPhone.get(payload.phone);
  if (!user || user.password !== payload.password) {
    return delay({
      success: false,
      message: "Incorrect phone number or password",
      data: null as never,
    });
  }
  if (!user.role || !user.fullName) {
    return delay({
      success: false,
      message: "Account setup incomplete - finish registration first",
      data: null as never,
    });
  }
  return delay({
    success: true,
    message: "Logged in",
    data: {
      accessToken: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      location: user.location ?? "",
      businessName: user.businessName,
      photoUri: user.photoUri,
    },
  });
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ApiResponse<{ userId: string }>> {
  const user = usersByPhone.get(payload.phone);
  if (!user) {
    return delay({
      success: false,
      message: "No account found with that number",
      data: null as never,
    });
  }
  console.log(`[mock authService] password reset OTP for ${payload.phone}: ${MOCK_OTP}`);
  return delay({ success: true, message: "OTP sent", data: { userId: user.id } });
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ApiResponse<{ success: true }>> {
  const user = findById(payload.userId);
  if (user) user.password = payload.newPassword;
  return delay({ success: true, message: "Password updated", data: { success: true } });
}
