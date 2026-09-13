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
  verified: boolean;
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

// Returned once an account is fully set up (profile complete or login) -
// everything AuthContext.login() needs to build a session.
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
