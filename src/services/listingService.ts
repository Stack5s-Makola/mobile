import * as apiListingService from "@services/api/listingService";

// Listings are live on the real backend (confirmed by backend dev,
// served under /api/products). Swapped from mocks/listingService here.
// If this starts erroring, the mock is still available as a fallback:
// import * as mockListingService from "@services/mocks/listingService";
export const listingService = apiListingService;
