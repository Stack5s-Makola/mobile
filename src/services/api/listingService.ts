import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";
import { apiRequest } from "./client";

// Real backend call. Same signature as src/services/mocks/listingService.ts
// on purpose - swap the import in BuyerHomeScreen once this endpoint is live.

export function getListings(): Promise<ApiResponse<Listing[]>> {
  return apiRequest<Listing[]>("/api/listings");
}
