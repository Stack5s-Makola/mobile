import { ApiResponse } from "@types/api";
import {
  RegisterPayload,
  RegisterResult,
  VerifyOtpPayload,
  VerifyOtpResult,
  SelectRolePayload,
} from "@types/auth";

// Mock auth service. Returns the same ApiResponse<T> shape the real
// backend uses (src/services/api/authService.ts), so screens can swap
// the import once Promise's User/Seller endpoints are live - no screen
// code changes needed.
//
// Fixed OTP for local testing: 123456 (logged below for convenience).

const MOCK_DELAY_MS = 500;
const FIXED_OTP = "123456";

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// In-memory store standing in for the backend during mock development.
const mockUsers = new Map<string, { fullName: string; phone: string }>();

export async function register(
  payload: RegisterPayload
): Promise<ApiResponse<RegisterResult>> {
  const userId = `mock-${Date.now()}`;
  mockUsers.set(userId, payload);

  console.log(`[mock authService] OTP for ${payload.phone} is ${FIXED_OTP}`);

  return delay({
    success: true,
    message: "OTP sent",
    data: { userId, phone: payload.phone },
  });
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<VerifyOtpResult>> {
  const user = mockUsers.get(payload.userId);

  if (!user) {
    return delay({
      success: false,
      message: "User not found",
      data: null as unknown as VerifyOtpResult,
    });
  }

  if (payload.code !== FIXED_OTP) {
    return delay({
      success: false,
      message: "Invalid OTP code",
      data: null as unknown as VerifyOtpResult,
    });
  }

  return delay({
    success: true,
    message: "OTP verified",
    data: {
      accessToken: `mock-access-${payload.userId}`,
      refreshToken: `mock-refresh-${payload.userId}`,
      userId: payload.userId,
      phone: user.phone,
      fullName: user.fullName,
      role: null,
    },
  });
}

export async function selectRole(
  payload: SelectRolePayload
): Promise<ApiResponse<{ userId: string; role: string }>> {
  return delay({
    success: true,
    message: "Role saved",
    data: { userId: payload.userId, role: payload.role },
  });
}
