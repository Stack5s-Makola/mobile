import { ApiResponse } from "@types/api";
import { apiRequest } from "./client";
import { SavedSeller } from "@services/mocks/savedService";

// Real backend calls, once SavedProduct/SavedSeller endpoints exist
// (per the architecture doc). Same names/signatures as
// src/services/mocks/savedService.ts.

export function getSavedProductIds(): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>("/api/saved/products");
}

export function toggleSavedProduct(id: string): Promise<ApiResponse<{ saved: boolean }>> {
  return apiRequest(`/api/saved/products/${id}`, { method: "POST" });
}

export function getSavedSellers(): Promise<ApiResponse<SavedSeller[]>> {
  return apiRequest<SavedSeller[]>("/api/saved/sellers");
}

export function toggleSavedSeller(seller: SavedSeller): Promise<ApiResponse<{ saved: boolean }>> {
  return apiRequest(`/api/saved/sellers`, { method: "POST", body: JSON.stringify(seller) });
}
