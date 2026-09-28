import { ApiResponse } from "../../types/api";
import { Listing } from "../../types/listing";
import { authedApiRequest } from "./client";

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
  image?: string | null;
  imageUrl?: string | null;
  location?: string | { latitude?: number; longitude?: number } | null;
  // The readable place name; `location` is coordinates.
  locationName?: string | null;
  distanceKm?: number | null;
  category?:
    | {
        id?: string | null;
        name?: string | null;
        slug?: string | null;
        label?: string | null;
      }
    | string
    | null;
  seller?: {
    id?: string | null;
    shopName?: string | null;
    phone?: string | null;
    verificationStatus?: string | null;
  } | null;
  shop?: {
    id?: string | null;
    shopName?: string | null;
    phone?: string | null;
    logo?: string | null;
    verificationStatus?: string | null;
  } | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function categoryId(category: ApiProduct["category"]): string {
  const raw =
    typeof category === "string"
      ? category
      : (category?.slug ??
        category?.name ??
        category?.label ??
        category?.id ??
        "");
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "-");

  const aliases: Record<string, string> = {
    fabric: "fabrics",
    fabrics: "fabrics",
    handicrafts: "handicraft",
    beauty: "beauty",
    "farm-produce": "farm-produce",
    "farm produce": "farm-produce",
    electronics: "electronics",
  };

  return aliases[normalized] ?? normalized;
}

function locationLabel(
  location: ApiProduct["location"],
  locationName?: string | null,
): string {
  // Prefer the place name - coordinates are a last resort, not something to
  // show a buyer.
  if (locationName) return locationName;
  if (typeof location === "string") return location;
  if (location && typeof location === "object") {
    const { latitude, longitude } = location;
    if (latitude !== undefined && longitude !== undefined) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  }
  return "";
}

function toListing(product: ApiProduct): Listing {
  return {
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    mainImage: product.image ?? product.imageUrl ?? product.images?.[0] ?? "",
    sellerName: product.seller?.shopName ?? product.shop?.shopName ?? "",
    sellerPhone: product.seller?.phone ?? product.shop?.phone ?? "",
    sellerVerified:
      product.seller?.verificationStatus === "verified" ||
      product.shop?.verificationStatus === "verified",
    category: categoryId(product.category),
    location: locationLabel(product.location, product.locationName),
    distanceKm: product.distanceKm ?? null,
    description: product.description ?? undefined,
  };
}

function mapList(res: ApiResponse<ApiProduct[]>): ApiResponse<Listing[]> {
  return {
    ...res,
    data: res.success && Array.isArray(res.data) ? res.data.map(toListing) : [],
  };
}

export interface ProductFilters {
  category?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export async function getListings(
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
  return mapList(
    await authedApiRequest<ApiProduct[]>(
      `/api/buyer/products${query ? `?${query}` : ""}`,
    ),
  );
}

export async function searchListings(
  query: string,
): Promise<ApiResponse<Listing[]>> {
  const res = await authedApiRequest<ApiProduct[]>(
    `/api/buyer/products/search?q=${encodeURIComponent(query.trim())}`,
  );
  return mapList(res);
}

export async function getListingById(
  id: string,
): Promise<ApiResponse<Listing | null>> {
  const res = await authedApiRequest<ApiProduct | null>(
    `/api/buyer/products/${encodeURIComponent(id)}`,
  );
  return { ...res, data: res.success && res.data ? toListing(res.data) : null };
}

export async function getListingsByCategory(
  categoryId: string,
): Promise<ApiResponse<Listing[]>> {
  return getListings({ category: categoryId });
}
