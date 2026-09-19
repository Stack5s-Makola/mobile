import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";
import { apiRequest } from "./client";

// Real backend calls. Served under /api/products (not /api/listings -
// confirmed with the backend dev). Same function names/signatures as
// src/services/mocks/listingService.ts.

export function getListings(): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>("/api/products");
}

export function getListingById(id: string): Promise<ApiResponse<Listing | null>> {
  return apiRequest<Listing | null>(`/api/products/${id}`);
}

export function getListingsByCategory(categoryId: string): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>(`/api/products?categoryId=${categoryId}`);
}
