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

// Mock-backed flows still identify the account by userId.
export interface VerifyOtpPayload {
  userId: string;
  code: string;
}

// The real endpoint, POST /api/verify-otp, keys off the email instead -
// seller registration returns no userId to key off. Verified live:
//   400 { errors: { code: "code must be 6 digits" } }  malformed code
//   400 "This verification code is incorrect"          wrong code
//   400 "No verification code is pending for this email address"
export interface VerifyEmailOtpPayload {
  email: string;
  code: string;
}

// POST /api/verify-otp/resend. Throttled to one per 60 seconds; a faster tap
// returns 400 "Please wait 56 seconds before requesting another code".
export interface ResendOtpResult {
  email: string;
  expiresAt: string; // ISO, ~10 minutes out
}

// Everything the seller typed during sign-up. The backend stores it but
// returns none of it, so it rides through the OTP screen in nav params to
// populate the session that the seller dashboard reads.
export interface SellerProfileDraft {
  fullName: string;
  businessName: string;
  location: string;
  photoUri?: string;
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
// Confirmed against POST /api/register/set-seller-profile (probed live).
// Field names differ from ours on the wire - the service maps them:
//   fullName -> name, businessName -> shopName, plus role: "SELLER".
//
// location is GPS coordinates, NOT a place name.
// photoUri is not part of the contract - the endpoint ignores it, so the
// seller's photo is not uploaded anywhere yet.
export interface SellerLocation {
  latitude: number;
  longitude: number;
  // Extra keys are accepted by the endpoint (verified), so the location the
  // seller actually typed is carried here until real coordinates exist.
  address?: string;
}

export interface RegisterSellerPayload {
  phone: string;
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  location: SellerLocation;
  photoUri?: string;
}

// Confirmed: a successful registration returns only { saved: true } - no
// userId and no phone. The follow-up OTP step therefore has to identify the
// account by the email the client already collected.
export interface RegisterSellerResult {
  saved: boolean;
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
