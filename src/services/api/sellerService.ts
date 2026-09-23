import { ApiResponse } from "@types/api";
import {
  ListingPayload,
  SellerDashboardData,
  DashboardListing,
  ListingApprovalStatus,
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

// GET /api/seller/dashboard - live, and the only seller endpoint that is.
// Returns { name, avatar, shopName, totalListings, approved, pending,
// rejected, recentListings }.
//
// The recentListings item shape could not be observed with a populated
// account (creating a product needs a sellerId this API doesn't expose), so
// it is read tolerantly: price arrives as a string from Postgres numerics
// the way /api/products does, and image/location may be absent entirely.
// Missing values become "" rather than undefined, because the row renders
// them directly.
type ApiDashboardListing = {
  id: string;
  name: string;
  price?: string | number | null;
  // The wire field is imageUrl (confirmed on /api/products); image/images
  // are accepted too in case the dashboard names it differently.
  imageUrl?: string | null;
  image?: string | null;
  images?: string[] | null;
  location?: string | { address?: string | null } | null;
  approvalStatus?: string | null;
  status?: string | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toStatus(raw: string | null | undefined): ListingApprovalStatus {
  const value = (raw ?? "").toLowerCase();
  return value === "approved" || value === "rejected" ? value : "pending";
}

function toLocation(location: ApiDashboardListing["location"]): string {
  if (typeof location === "string") return location;
  return location?.address ?? "";
}

function toDashboardListing(item: ApiDashboardListing): DashboardListing {
  return {
    id: item.id,
    name: item.name,
    price: toNumber(item.price),
    image: item.imageUrl ?? item.image ?? item.images?.[0] ?? "",
    location: toLocation(item.location),
    status: toStatus(item.approvalStatus ?? item.status),
  };
}

// POST /api/seller/me/update/shop-name - { shopName }.
// Shop names are globally unique, so expect a 409 when one is taken (the
// registration endpoint returns "That shop name is already taken").
export function updateShopName(shopName: string): Promise<ApiResponse<unknown>> {
  return authedApiRequest("/api/seller/me/update/shop-name", {
    method: "POST",
    body: JSON.stringify({ shopName: shopName.trim() }),
  });
}

// POST /api/seller/me/update/profile-picture - multipart, a single `image`
// field and nothing else. Verified live; returns { avatar, logo }, both the
// same Cloudinary URL, and the dashboard's `avatar` reflects it immediately.
//
//   400 "No picture was sent"          no file part
//   400 "The file must be an image"    wrong mime type
//   400 "The image must be under 5MB"
//   401 missing/invalid token
//   403 "This account does not have a shop"   buyer account
export function updateProfilePicture(
  uri: string
): Promise<ApiResponse<{ avatar: string; logo: string }>> {
  const extension = (uri.split(".").pop() ?? "").toLowerCase();
  const safe = /^(jpg|jpeg|png|webp|heic)$/.test(extension) ? extension : "jpg";
  const form = new FormData();
  form.append("image", {
    uri,
    name: `profile-picture.${safe}`,
    type: safe === "jpg" ? "image/jpeg" : `image/${safe}`,
  } as unknown as Blob);

  return authedApiRequest("/api/seller/me/update/profile-picture", {
    method: "POST",
    body: form,
  });
}

export async function getDashboard(): Promise<ApiResponse<SellerDashboardData>> {
  const res = await authedApiRequest<SellerDashboardData & {
    recentListings?: ApiDashboardListing[] | null;
    // The shop's logo is `seller.logoUrl` on /api/products. The dashboard
    // exposes it as `avatar`, which is null on every account so far - accept
    // the other spellings so it works whichever way it gets wired up.
    logoUrl?: string | null;
    seller?: { logoUrl?: string | null } | null;
  }>("/api/seller/dashboard");

  if (!res.success) return res as ApiResponse<SellerDashboardData>;

  return {
    ...res,
    data: {
      ...res.data,
      avatar: res.data?.avatar ?? res.data?.logoUrl ?? res.data?.seller?.logoUrl ?? null,
      recentListings: Array.isArray(res.data?.recentListings)
        ? res.data.recentListings.map(toDashboardListing)
        : [],
    },
  };
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
