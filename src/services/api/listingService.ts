import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";
import { apiRequest } from "./client";

// Buyer product endpoints. Same function names/signatures as the mock
// service so screens can remain independent of the transport.

export interface ProductFilters {
  category?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export function getListings(
  filters: ProductFilters = {},
): Promise<ApiResponse<Listing[]>> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.latitude !== undefined)
    params.set("latitude", String(filters.latitude));
  if (filters.longitude !== undefined)
    params.set("longitude", String(filters.longitude));
  if (filters.radiusKm !== undefined)
    params.set("radiusKm", String(filters.radiusKm));
  const query = params.toString();
  return apiRequest<Listing[]>(`/buyer/products${query ? `?${query}` : ""}`);
}

export function searchListings(query: string): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>(
    `/buyer/products/search?q=${encodeURIComponent(query.trim())}`,
  );
}

export function getListingById(
  id: string,
): Promise<ApiResponse<Listing | null>> {
  return apiRequest<Listing | null>(
    `/buyer/products/${encodeURIComponent(id)}`,
  );
}

export function getListingsByCategory(
  categoryId: string,
): Promise<ApiResponse<Listing[]>> {
  return getListings({ category: categoryId });
}
