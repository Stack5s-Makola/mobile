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

// What the user typed during sign-up. The backend returns none of it, so it
// rides through the OTP screen in nav params to populate the session that
// the dashboards read. businessName/photoUri are seller-only.
export interface ProfileDraft {
  fullName: string;
  location: string;
  businessName?: string;
  photoUri?: string;
}

// Carried from registration into the OTP screen: a token is issued before
// the email is verified, so it waits there rather than becoming a session.
export interface IssuedFromRegister {
  accessToken: string;
  userId: string;
  role: UserRole;
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

// Confirmed against POST /api/register/set-seller-profile (probed live).
// Field names differ from ours on the wire - the service maps them:
//   fullName -> name, businessName -> shopName, plus role: "SELLER".
//
// location is GPS coordinates, NOT a place name.
// photoUri is a local device URI. It's sent as the multipart `image` field,
// stored on Cloudinary server-side, and comes back as `avatar` on the seller
// dashboard. Optional - sellers who skip the photo still register.
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

// What the backend hands back once an account exists. Confirmed live.
// Note there is no refresh token, and the access token is short-lived.
export interface IssuedAuth {
  accessToken: string;
  expiresIn: string; // e.g. "15m"
  user: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
}

// Registration issues a token immediately, before the email is verified
// (user.emailVerified is false at this point). The OTP step still has to
// pass before the seller is let into the app, so this token is carried
// through the OTP screen rather than being turned into a session straight
// away. It does NOT contain the phone or the profile fields, so those are
// still forwarded separately.
export interface RegisterSellerResult extends IssuedAuth {
  saved: boolean;
}

// POST /api/register/buyer. Unlike the seller endpoint there are no profile
// fields - a buyer's name and location have nowhere to go on the backend, so
// they're collected for the local session only.
export interface RegisterBuyerPayload {
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  photoUri?: string;
}

// Shape follows the seller endpoint's; `saved` and `expiresIn` are treated
// as optional until confirmed live (it is localhost-only so far).
export interface RegisterBuyerResult {
  accessToken?: string;
  token?: string;
  expiresIn?: string;
  saved?: boolean;
  user?: {
    id?: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
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

// POST /api/login keys off email, not phone.
export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ResetPasswordPayload {
  userId: string;
  newPassword: string;
}
