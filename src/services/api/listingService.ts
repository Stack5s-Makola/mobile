import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";
import { apiRequest } from "./client";

// Real backend calls. Same function names/signatures as
// src/services/mocks/listingService.ts on purpose.

export function getListings(): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>("/api/listings");
}

export function getListingById(id: string): Promise<ApiResponse<Listing | null>> {
  return apiRequest<Listing | null>(`/api/listings/${id}`);
}

export function getListingsByCategory(categoryId: string): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>(`/api/listings?category=${categoryId}`);
}
