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
  subcategory?: string | null;
  tags?: string[] | null;
  stock?: string | number | null;
  quantity?: string | number | null;
  status?: string | null;
  listedAt?: string | null;
  createdAt?: string | null;
  category?:
    | {
        id?: string | null;
        name?: string | null;
        slug?: string | null;
        label?: string | null;
      }
    | string
    | null;
  seller?: ApiProductShop | null;
  shop?: ApiProductShop | null;
  // Some payloads hang the owner off the product rather than the shop.
  owner?: ApiProductOwner | null;
};

// The person behind a shop. Spelled several ways across the API, so each
// plausible key is read rather than guessed at.
type ApiProductOwner = {
  name?: string | null;
  fullName?: string | null;
  picture?: string | null;
  profilePicture?: string | null;
  avatar?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
} | null;

type ApiProductShop = {
  id?: string | null;
  shopName?: string | null;
  phone?: string | null;
  logo?: string | null;
  verificationStatus?: string | null;
  owner?: ApiProductOwner;
  user?: ApiProductOwner;
  ownerName?: string | null;
  ownerPicture?: string | null;
  ownerPhone?: string | null;
} | null;

function ownerOf(product: ApiProduct): {
  name: string | null;
  picture: string | null;
  phone: string | null;
} {
  // Nested owner objects first, then the flattened spellings.
  const nested =
    product.seller?.owner ??
    product.seller?.user ??
    product.shop?.owner ??
    product.shop?.user ??
    product.owner ??
    null;

  const name =
    nested?.name ??
    nested?.fullName ??
    product.seller?.ownerName ??
    product.shop?.ownerName ??
    null;

  const picture =
    nested?.picture ??
    nested?.profilePicture ??
    nested?.avatar ??
    product.seller?.ownerPicture ??
    product.shop?.ownerPicture ??
    // The shop's own logo is the last resort - better a real image than a
    // blank circle, and on most shops it's the same photo anyway.
    product.shop?.logo ??
    null;

  const phone =
    nested?.phone ??
    nested?.phoneNumber ??
    product.seller?.ownerPhone ??
    product.shop?.ownerPhone ??
    null;

  return { name, picture, phone };
}

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
  const owner = ownerOf(product);
  const rawStock = product.stock ?? product.quantity;
  // Every image the payload carries, lead one first, duplicates dropped.
  const images = Array.from(
    new Set(
      [product.image, product.imageUrl, ...(product.images ?? [])].filter(
        (uri): uri is string => Boolean(uri)
      )
    )
  );
  return {
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    mainImage: images[0] ?? "",
    sellerName: product.seller?.shopName ?? product.shop?.shopName ?? "",
    ownerName: owner.name,
    ownerPicture: owner.picture,
    // Either is a way to reach them; without one, Contact Seller has nothing
    // to dial.
    sellerPhone: product.seller?.phone ?? product.shop?.phone ?? owner.phone ?? "",
    sellerVerified:
      product.seller?.verificationStatus === "verified" ||
      product.shop?.verificationStatus === "verified",
    category: categoryId(product.category),
    location: locationLabel(product.location, product.locationName),
    distanceKm: product.distanceKm ?? null,
    description: product.description ?? undefined,
    subcategory: product.subcategory ?? null,
    tags: product.tags ?? [],
    // Not `raw ? ... : null` - a stock of 0 is real (sold out), not absent.
    stock:
      rawStock === null || rawStock === undefined ? null : toNumber(rawStock),
    status: product.status ?? null,
    listedAt: product.listedAt ?? product.createdAt ?? null,
    images: images,
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
