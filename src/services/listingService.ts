import * as apiListingService from "@services/api/listingService";

// Listings are served by the buyer product endpoints. The mock remains
// available for local development if the API is unavailable.
export const listingService = apiListingService;
