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
import { apiRequest, formDataRequest } from "./client";
import {
  RegisterSellerPayload,
  RegisterSellerResult,
  VerifyEmailOtpPayload,
  ResendOtpResult,
  RegisterBuyerPayload,
  RegisterBuyerResult,
  LoginResult,
} from "@types/auth";

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
// 6-digit code, in one call. Sent as multipart/form-data so the shop photo
// can ride along; the server stores it on Cloudinary and the returned URL
// then shows up as `avatar` on the dashboard. Contract confirmed by probing
// the live endpoint:
//
//   field                 <- our field      notes
//   email                 <- email
//   phone                 <- phone          9-15 digits, optional leading +
//   password              <- password       min 8 characters
//   name                  <- fullName       max 120 chars
//   shopName              <- businessName   max 120 chars, globally unique
//   location[latitude]    <- location       bracket fields, NOT a JSON string -
//   location[longitude]   <- location       a JSON string fails validation
//   location[address]     <- location       with "location must be an object"
//   role                  <- (constant)     "SELLER"
//   image                 <- photoUri       the file. This exact field name -
//                                           anything else is rejected with
//                                           "Unexpected field - <name>".
//
// Omitting `image` is fine: sellers who skip the photo still register.
//
// Returns { saved, accessToken, expiresIn, user } - a token is issued here,
// before the email is verified. The OTP step identifies the account by email
// (the response carries no phone).
//
// 409s to expect, message only (no `errors` map):
//   "An account with that phone number already exists"
//   "An account with this email already exists"
//   "That shop name is already taken"

// React Native's FormData takes {uri, name, type} in place of a Blob.
type FormDataFile = { uri: string; name: string; type: string };

function toFilePart(uri: string): FormDataFile {
  const extension = (uri.split(".").pop() ?? "").toLowerCase();
  const safe = /^(jpg|jpeg|png|webp|heic)$/.test(extension) ? extension : "jpg";
  return {
    uri,
    name: `shop-logo.${safe}`,
    type: safe === "jpg" ? "image/jpeg" : `image/${safe}`,
  };
}

export function registerSeller(
  payload: RegisterSellerPayload,
): Promise<ApiResponse<RegisterSellerResult>> {
  const form = new FormData();
  form.append("email", payload.email.trim());
  form.append("phone", payload.phone.trim());
  form.append("password", payload.password);
  form.append("name", payload.fullName.trim());
  form.append("shopName", payload.businessName.trim());
  form.append("role", "SELLER");
  form.append("location[latitude]", String(payload.location.latitude));
  form.append("location[longitude]", String(payload.location.longitude));
  if (payload.location.address) {
    form.append("location[address]", payload.location.address);
  }
  if (payload.photoUri) {
    form.append("image", toFilePart(payload.photoUri) as unknown as Blob);
  }

  return apiRequest("/api/register/set-seller-profile", {
    method: "POST",
    body: form,
  });
}

// POST /api/register/buyer - creates a buyer account and emails a code.
// Takes credentials only; there are no profile fields on this endpoint.
// Like the seller endpoint it issues a token before the email is verified.
export function registerBuyer(
  payload: RegisterBuyerPayload,
): Promise<ApiResponse<RegisterBuyerResult>> {
  const body = new FormData();
  body.append("email", payload.email.trim());
  body.append("phone", payload.phone.trim());
  body.append("password", payload.password);
  body.append("role", "BUYER");
  if (payload.photoUri) {
    body.append("image", {
      uri: payload.photoUri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
  }
  return formDataRequest<RegisterBuyerResult>("/api/register/buyer", body);
}

// POST /api/verify-otp - checks the 6-digit code that was emailed.
//
// Failure messages are already user-facing, so screens can show res.message
// as-is; a malformed code comes back under errors.code instead.
//
// The success payload isn't pinned down yet (it can't be probed without a
// real code from an inbox), so the result is left as unknown - the screen
// only branches on res.success today.
export function verifyOtp(
  payload: VerifyEmailOtpPayload,
): Promise<ApiResponse<unknown>> {
  return apiRequest("/api/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email: payload.email.trim(), code: payload.code }),
  });
}

// POST /api/verify-otp/resend - sends a fresh code to an email address.
//
//   200 { email, expiresAt }
//   400 "Please wait 56 seconds before requesting another code"  (throttled)
//   400 { errors: { email: "Please provide a valid email address" } }
export function resendOtp(
  email: string,
): Promise<ApiResponse<ResendOtpResult>> {
  return apiRequest("/api/verify-otp/resend", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  userId?: string;
  id?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  fullName?: string;
  location?: string;
  businessName?: string;
  photoUri?: string;
  user?: {
    id?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    name?: string;
    picture?: string;
  };
};

export async function login(
  payload: LoginPayload,
): Promise<ApiResponse<AuthSessionResult>> {
  const res = await apiRequest<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
  if (!res.success) return { ...res, data: null as never };

  const data = res.data;
  const user = data.user;
  return {
    ...res,
    data: {
      accessToken: data.accessToken ?? data.token ?? "",
      refreshToken: data.refreshToken ?? "",
      userId: data.userId ?? data.id ?? user?.id ?? "",
      phone: data.phone ?? user?.phone ?? "",
      email: data.email ?? user?.email ?? payload.email.trim(),
      role: data.role ?? user?.role ?? "BUYER",
      fullName: data.fullName ?? user?.name ?? "",
      location: data.location ?? "",
      businessName: data.businessName,
      photoUri: data.photoUri ?? user?.picture,
    },
  };
}

export function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest("/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
