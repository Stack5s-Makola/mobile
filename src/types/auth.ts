import { UserRole } from "./user";

export interface RegisterPayload {
  phone: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  userId: string;
  phone: string;
}

export interface VerifyOtpPayload {
  userId: string;
  code: string;
}

export interface VerifyOtpResult {
  userId: string;
  phone: string;
  email: string;
  verified: true;
}

export interface SelectRolePayload {
  userId: string;
  role: UserRole;
}

export interface BuyerProfilePayload {
  userId: string;
  fullName: string;
  location: string;
}

export interface SellerProfilePayload {
  userId: string;
  fullName: string;
  businessName: string;
  location: string;
  photoUri?: string;
}

// TODO: field names below are our best guess pending Daniel confirming
// the exact request body for POST /api/register/set-seller-profile.
// Likely correct given what the screen collects, but not verified.
export interface RegisterSellerPayload {
  phone: string;
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  location: string;
  photoUri?: string;
}

// TODO: response shape is a guess - specifically need to confirm what
// identifier the follow-up OTP-verify call should use (userId? phone?
// something else the backend returns).
export interface RegisterSellerResult {
  userId: string;
  phone: string;
}

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  phone: string;
  email: string;
  role: UserRole;
  fullName: string;
  location: string;
  businessName?: string;
  photoUri?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ResetPasswordPayload {
  userId: string;
  newPassword: string;
}
