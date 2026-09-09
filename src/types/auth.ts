import { UserRole } from "./user";

export interface RegisterPayload {
  fullName: string;
  phone: string;
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
  accessToken: string;
  refreshToken: string;
  userId: string;
  phone: string;
  fullName: string;
  role: UserRole | null; // null until role selection completes
}

export interface SelectRolePayload {
  userId: string;
  role: UserRole;
}
