import * as mockSellerService from "@services/mocks/sellerService";

// Every seller screen reads through this one switch instead of importing
// a mock directly. Once the Seller endpoints are live, change this import
// to "@services/api/sellerService" - same names/signatures, nothing else
// in the seller screens needs to change.
export const sellerService = mockSellerService;
