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
  role?: string;
}

export function getProfile(): Promise<ApiResponse<BuyerProfile>> {
  return authedApiRequest<BuyerProfile>("/buyer/my-profile");
}

export function getPersonalDetails(): Promise<
  ApiResponse<BuyerPersonalDetails>
> {
  return authedApiRequest<BuyerPersonalDetails>(
    "/buyer/my-profile/personal-details",
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
    "/buyer/my-profile",
    body,
    "PATCH",
  );
}
