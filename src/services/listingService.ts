import * as mockListingService from "@services/mocks/listingService";

// Every buyer screen reads through this one switch instead of importing a
// mock directly. Once the listings endpoint is live, change this import to
// "@services/api/listingService" - same names/signatures, nothing else
// needs to change. (Pattern adopted from Daniel's sellerService.ts.)
export const listingService = mockListingService;
