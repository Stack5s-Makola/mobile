import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";
import { apiRequest } from "./client";

// Real backend calls. Served under /api/products (not /api/listings -
// confirmed with the backend dev). Same function names/signatures as
// src/services/mocks/listingService.ts.
//
// The wire shape is NOT the app's Listing, so everything is normalized here
// rather than cast and hoped for:
//   - price arrives as a string ("150"), because Postgres numerics serialize
//     that way. Casting it to Listing made `price.toFixed()` blow up at the
//     first real product.
//   - the seller is nested, and shopName stands in for the seller's name.
//   - mainImage, sellerPhone and location have no wire equivalent yet, so
//     they fall back to empty rather than undefined - the UI renders them
//     directly and `undefined` would print "undefined".
//
// Normalizing at this one boundary keeps every screen working off a single
// shape; widen the mapper as the backend fills these fields in.

type ApiProduct = {
  id: string;
  name: string;
  price: string | number | null;
  description?: string | null;
  images?: string[] | null;
  category?: { id?: string | null } | string | null;
  seller?: {
    shopName?: string | null;
    phone?: string | null;
    verificationStatus?: string | null;
  } | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function categoryId(category: ApiProduct["category"]): string {
  if (typeof category === "string") return category;
  return category?.id ?? "";
}

function toListing(product: ApiProduct): Listing {
  return {
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    mainImage: product.images?.[0] ?? "",
    sellerName: product.seller?.shopName ?? "",
    sellerPhone: product.seller?.phone ?? "",
    sellerVerified: product.seller?.verificationStatus === "verified",
    category: categoryId(product.category),
    location: "",
    description: product.description ?? undefined,
  };
}

function mapList(res: ApiResponse<ApiProduct[]>): ApiResponse<Listing[]> {
  return {
    ...res,
    data: res.success && Array.isArray(res.data) ? res.data.map(toListing) : [],
  };
}

export async function getListings(): Promise<ApiResponse<Listing[]>> {
  return mapList(await apiRequest<ApiProduct[]>("/api/products"));
}

export async function getListingById(id: string): Promise<ApiResponse<Listing | null>> {
  const res = await apiRequest<ApiProduct | null>(`/api/products/${id}`);
  return { ...res, data: res.success && res.data ? toListing(res.data) : null };
}

export async function getListingsByCategory(
  categoryId: string
): Promise<ApiResponse<Listing[]>> {
  return mapList(await apiRequest<ApiProduct[]>(`/api/products?categoryId=${categoryId}`));
}
