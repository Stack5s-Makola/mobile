import { ApiResponse } from "@types/api";
import {
  ListingPayload,
  SellerDashboard,
  SellerListing,
  Shop,
  SubmitVerificationPayload,
  UpdateShopPayload,
  Verification,
} from "@types/seller";
import { authedApiRequest } from "./client";

// Real backend calls. Same function names/signatures as
// src/services/mocks/sellerService.ts on purpose - swap the import in
// src/services/sellerService.ts once the Seller endpoints are live.
//
// The seller is identified by the bearer token, so no sellerId is passed.
// Paths below are the proposed contract - confirm with Promise's Seller
// module before switching over.
//
// TODO(upload): listing images, shop photo and verification documents are
// local file URIs on the device. Once the upload endpoint/storage is
// decided, upload them first and send the returned URLs in these payloads.

export function getDashboard(): Promise<ApiResponse<SellerDashboard>> {
  return authedApiRequest("/api/seller/dashboard");
}

export function getShop(): Promise<ApiResponse<Shop>> {
  return authedApiRequest("/api/seller/shop");
}

export function updateShop(payload: UpdateShopPayload): Promise<ApiResponse<Shop>> {
  return authedApiRequest("/api/seller/shop", { method: "PATCH", body: JSON.stringify(payload) });
}

export function getMyListings(): Promise<ApiResponse<SellerListing[]>> {
  return authedApiRequest("/api/seller/listings");
}

export function getMyListing(listingId: string): Promise<ApiResponse<SellerListing>> {
  return authedApiRequest(`/api/seller/listings/${listingId}`);
}

export function createListing(payload: ListingPayload): Promise<ApiResponse<SellerListing>> {
  return authedApiRequest("/api/seller/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateListing(
  listingId: string,
  payload: ListingPayload
): Promise<ApiResponse<SellerListing>> {
  return authedApiRequest(`/api/seller/listings/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteListing(listingId: string): Promise<ApiResponse<{ id: string }>> {
  return authedApiRequest(`/api/seller/listings/${listingId}`, { method: "DELETE" });
}

export function getVerification(): Promise<ApiResponse<Verification>> {
  return authedApiRequest("/api/seller/verification");
}

export function submitVerification(
  payload: SubmitVerificationPayload
): Promise<ApiResponse<Verification>> {
  return authedApiRequest("/api/seller/verification", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
