import { ApiResponse } from "../../types/api";
import { authedApiRequest } from "./client";
import { Listing } from "../../types/listing";

export interface SavedShop {
  id?: string;
  name: string;
  phone?: string;
  image?: string;
  photoUri?: string;
}

export function getSavedProducts(): Promise<ApiResponse<Listing[]>> {
  return authedApiRequest<Listing[]>("/buyer/saved/products");
}

export function toggleSavedProduct(
  id: string,
): Promise<ApiResponse<{ saved: boolean }>> {
  return authedApiRequest(`/buyer/saved/products/${encodeURIComponent(id)}`, {
    method: "POST",
  });
}

export function getSavedShops(): Promise<ApiResponse<SavedShop[]>> {
  return authedApiRequest<SavedShop[]>("/buyer/saved/shops");
}

export function toggleSavedShop(
  shop: SavedShop,
): Promise<ApiResponse<{ saved: boolean }>> {
  return authedApiRequest(`/buyer/saved/shops`, {
    method: "POST",
    body: JSON.stringify(shop),
  });
}
