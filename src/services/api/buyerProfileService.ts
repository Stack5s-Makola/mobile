import { ApiResponse } from "@types/api";
import { authedApiRequest, authedFormDataRequest } from "./client";

export interface BuyerProfile {
  name: string | null;
  // The API field is `profilePicture` (verified against GET
  // /api/buyer/my-profile). picture/image are kept as fallbacks only because
  // older code read those names.
  profilePicture?: string | null;
  picture?: string | null;
  image?: string | null;
  email?: string | null;
  locationName?: string | null;
}

export interface BuyerPersonalDetails extends BuyerProfile {
  id?: string;
  phone?: string;
  // Not returned by the endpoint today - kept optional for when it is.
  location?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  joined?: string;
}

export function getProfile(): Promise<ApiResponse<BuyerProfile>> {
  return authedApiRequest<BuyerProfile>("/api/buyer/my-profile");
}

export function getPersonalDetails(): Promise<
  ApiResponse<BuyerPersonalDetails>
> {
  return authedApiRequest<BuyerPersonalDetails>(
    "/api/buyer/my-profile/personal-details",
  );
}

// POST /api/buyer/my-profile/update/name - { name } -> { name }
//   400 "name is required" when blank.
export function updateName(name: string): Promise<ApiResponse<{ name: string }>> {
  return authedApiRequest<{ name: string }>("/api/buyer/my-profile/update/name", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  });
}

// POST /api/buyer/my-profile/update/phone - { phone } -> { phone }
//   409 when another account already has that number. Re-saving your own is
//   fine, so there's no need to skip an unchanged value.
export function updatePhone(phone: string): Promise<ApiResponse<{ phone: string }>> {
  return authedApiRequest<{ phone: string }>("/api/buyer/my-profile/update/phone", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

// POST /api/buyer/my-profile/update/profile-picture - multipart, one `image`
// field. Verified live; returns { profilePicture } and it reads straight back
// from GET /api/buyer/my-profile.
export function updateProfilePicture(
  imageUri: string,
): Promise<ApiResponse<{ profilePicture: string }>> {
  const extension = (imageUri.split(".").pop() ?? "").toLowerCase();
  const safe = /^(jpg|jpeg|png|webp|heic)$/.test(extension) ? extension : "jpg";
  const body = new FormData();
  body.append("image", {
    uri: imageUri,
    name: `profile.${safe}`,
    type: safe === "jpg" ? "image/jpeg" : `image/${safe}`,
  } as unknown as Blob);
  return authedFormDataRequest<{ profilePicture: string }>(
    "/api/buyer/my-profile/update/profile-picture",
    body,
    "POST",
  );
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}



// POST /api/buyer/my-profile/update/password -> { changed: true }
//   401 "Your current password is incorrect"
//   400 "Password must be at least 8 characters long"
export function changePassword(
  payload: ChangePasswordPayload,
): Promise<ApiResponse<{ changed: boolean }>> {
  return authedApiRequest<{ changed: boolean }>(
    "/api/buyer/my-profile/update/password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export interface UpdateBuyerLocationPayload {
  latitude: number;
  longitude: number;
  locationName?: string;
  address?: string;
}

// POST /api/buyer/my-profile/update/location - { latitude, longitude, locationName }
export function updateLocation(
  payload: UpdateBuyerLocationPayload,
): Promise<ApiResponse<{ locationName?: string | null }>> {
  return authedApiRequest<{ locationName?: string | null }>(
    "/api/buyer/my-profile/update/location",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

