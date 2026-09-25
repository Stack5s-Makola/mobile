import { ApiResponse } from "@types/api";
import { authedApiRequest, authedFormDataRequest } from "./client";

export interface BuyerProfile {
  name: string;
  picture?: string | null;
  image?: string | null;
}

export interface BuyerPersonalDetails extends BuyerProfile {
  id?: string;
  email?: string;
  phone?: string;
  location?: string;
  role?: string;
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

export function updateProfile(
  name: string,
  imageUri: string,
): Promise<ApiResponse<BuyerProfile>> {
  const body = new FormData();
  body.append("name", name.trim());
  body.append("image", {
    uri: imageUri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  return authedFormDataRequest<BuyerProfile>(
    "/api/buyer/my-profile",
    body,
    "PATCH",
  );
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function updatePersonalDetails(
  payload: Partial<BuyerPersonalDetails>,
): Promise<ApiResponse<BuyerPersonalDetails>> {
  return authedApiRequest<BuyerPersonalDetails>(
    "/api/buyer/my-profile/personal-details",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<ApiResponse<{ success: boolean }>> {
  return authedApiRequest<{ success: boolean }>(
    "/api/buyer/my-profile/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
