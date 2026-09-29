import { ApiResponse } from "@types/api";
import { NearbyProduct, NearbySeller, NearbyShop, NearbyShopOwner } from "@types/seller";
import { distanceKm, toCoordinate } from "@utils/geo";
import { authedApiRequest } from "./client";

// Nearby search. Two things the API doesn't do that the callers need, both
// handled here so screens see one consistent shape:
//
//  - Coordinates come back as strings on /api/sellers/nearby.
//  - Neither endpoint returns a distance, so it's computed from the point
//    being searched around.

type ApiNearbySeller = {
  id: string;
  userId: string;
  shopName?: string | null;
  logoUrl?: string | null;
  verificationStatus?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distanceKm?: number | null;
};

type ApiNearbyProduct = {
  id: string;
  name: string;
  price?: string | number | null;
  image?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  category?: string | null;
  description?: string | null;
  stock?: string | number | null;
  quantity?: string | number | null;
  status?: string | null;
  createdAt?: string | null;
  distanceKm?: number | null;
  seller?: { shopName?: string | null } | null;
  shop?: { id?: string | null; shopName?: string | null } | null;
  location?: { latitude?: number | null; longitude?: number | null } | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

type ApiCoordinates = {
  latitude?: number | string | null;
  longitude?: number | string | null;
} | null;

type ApiShopOwner = {
  name?: string | null;
  fullName?: string | null;
  picture?: string | null;
  profilePicture?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  emailVerified?: boolean | null;
  isEmailVerified?: boolean | null;
};

type ApiNearbyShop = {
  id: string;
  shopName?: string | null;
  name?: string | null;
  logo?: string | null;
  picture?: string | null;
  description?: string | null;
  locationName?: string | null;
  verificationStatus?: string | null;
  verification?: string | null;
  distanceKm?: number | null;
  productCount?: number | null;
  joined?: string | null;
  joinedAt?: string | null;
  createdAt?: string | null;
  owner?: ApiShopOwner | null;
  // The shop's approved listings, as full product cards.
  listings?: ApiNearbyProduct[] | null;
  products?: ApiNearbyProduct[] | null;
  // `location` is the place NAME on this endpoint now, with `coordinates`
  // carrying the numbers. The object form is the pre-change shape, still read
  // so a stale deploy doesn't blank the map.
  location?: string | ApiCoordinates;
  coordinates?: ApiCoordinates;
};

// A place name where an object of coordinates used to be, or vice versa.
function pickCoordinates(shop: ApiNearbyShop): ApiCoordinates {
  if (shop.coordinates) return shop.coordinates;
  return typeof shop.location === "object" ? shop.location : null;
}

function pickPlaceName(shop: ApiNearbyShop): string | null {
  if (typeof shop.location === "string" && shop.location.trim()) return shop.location;
  return shop.locationName ?? null;
}

function mapOwner(owner: ApiShopOwner | null | undefined): NearbyShopOwner | null {
  if (!owner) return null;
  return {
    name: owner.name ?? owner.fullName ?? null,
    picture: owner.picture ?? owner.profilePicture ?? null,
    email: owner.email ?? null,
    phone: owner.phone ?? owner.phoneNumber ?? null,
    emailVerified: Boolean(owner.emailVerified ?? owner.isEmailVerified),
  };
}

// One mapping for both sources of products: the standalone /buyer/products
// list, and the listings now nested inside each nearby shop. `fallback` fills
// what a nested listing doesn't repeat - it already knows its shop, and its
// distance is the shop's.
function mapNearbyProduct(
  product: ApiNearbyProduct,
  origin: { longitude: number; latitude: number },
  fallback?: { shopId?: string; shopName?: string | null; distanceKm?: number | null }
): NearbyProduct {
  const productLatitude = toCoordinate(product.location?.latitude);
  const productLongitude = toCoordinate(product.location?.longitude);
  const computed =
    productLatitude !== null && productLongitude !== null
      ? distanceKm(origin.longitude, origin.latitude, productLongitude, productLatitude)
      : null;

  // Every image the card carries, with the lead one first.
  const images = [
    product.imageUrl ?? product.image ?? null,
    ...(product.images ?? []),
  ].filter((uri): uri is string => Boolean(uri));
  const unique = Array.from(new Set(images));

  // Not `rawStock ? ... : null` - a stock of 0 is real (sold out), not absent.
  const rawStock = product.stock ?? product.quantity;

  return {
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    image: unique[0] ?? null,
    images: unique,
    category: product.category ?? null,
    description: product.description ?? null,
    stock: rawStock === null || rawStock === undefined ? null : toNumber(rawStock),
    status: product.status ?? null,
    createdAt: product.createdAt ?? null,
    shopName:
      product.shop?.shopName ?? product.seller?.shopName ?? fallback?.shopName ?? null,
    distanceKm: product.distanceKm ?? computed ?? fallback?.distanceKm ?? null,
    shopId: product.shop?.id ?? fallback?.shopId ?? null,
  };
}

/**
 * Shops around a point, from GET /api/buyer/shops/nearby - or the seller
 * mirror at /api/seller/shops/nearby, which returns the same shape. It honours
 * radiusKm and returns distanceKm, a place name, the owner and the shop's
 * approved listings, so nothing is computed or filtered here.
 */
export async function getNearbyShops(
  longitude: number,
  latitude: number,
  radiusKm: number,
  // Each role has its own copy of the endpoint behind its own guard.
  role: "buyer" | "seller" = "buyer"
): Promise<ApiResponse<NearbyShop[]>> {
  const res = await authedApiRequest<ApiNearbyShop[]>(
    `/api/${role}/shops/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
  );

  if (res.success && Array.isArray(res.data)) {
    const shops = res.data
      .map((shop): NearbyShop | null => {
        const coordinates = pickCoordinates(shop);
        const shopLatitude = toCoordinate(coordinates?.latitude);
        const shopLongitude = toCoordinate(coordinates?.longitude);
        if (shopLatitude === null || shopLongitude === null) return null;

        const shopName = shop.shopName ?? shop.name ?? null;
        const distance =
          shop.distanceKm ??
          distanceKm(longitude, latitude, shopLongitude, shopLatitude);
        const listings = shop.listings ?? shop.products ?? [];
        const products = listings.map((listing) =>
          mapNearbyProduct(listing, { longitude, latitude }, {
            shopId: shop.id,
            shopName,
            distanceKm: distance,
          })
        );

        return {
          id: shop.id,
          shopName,
          logo: shop.logo ?? shop.picture ?? null,
          description: shop.description ?? null,
          latitude: shopLatitude,
          longitude: shopLongitude,
          locationName: pickPlaceName(shop),
          verificationStatus: shop.verificationStatus ?? shop.verification ?? null,
          distanceKm: distance,
          // The count is the listing array's length server-side, so the two
          // can't disagree - but fall back to it when listings are absent.
          productCount: products.length || (shop.productCount ?? 0),
          owner: mapOwner(shop.owner),
          joinedAt: shop.joined ?? shop.joinedAt ?? shop.createdAt ?? null,
          products,
        };
      })
      .filter((shop): shop is NearbyShop => shop !== null)
      // Sellers only. Every row the endpoint returns today is a shop, but a
      // buyer account would arrive without a shopName - skip those rather
      // than plotting a nameless pin.
      .filter((shop) => Boolean(shop.shopName));
    return { ...res, data: shops };
  }

  return { ...res, data: [] } as ApiResponse<NearbyShop[]>;
}

export async function getNearbySellers(
  longitude: number,
  latitude: number,
  radiusKm: number
): Promise<ApiResponse<NearbySeller[]>> {
  const res = await authedApiRequest<ApiNearbySeller[]>(
    `/api/sellers/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
  );
  if (!res.success || !Array.isArray(res.data)) {
    return { ...res, data: [] } as ApiResponse<NearbySeller[]>;
  }

  const sellers = res.data
    .map((seller): NearbySeller | null => {
      const sellerLatitude = toCoordinate(seller.latitude);
      const sellerLongitude = toCoordinate(seller.longitude);
      if (sellerLatitude === null || sellerLongitude === null) return null;

      return {
        id: seller.id,
        userId: seller.userId,
        shopName: seller.shopName ?? null,
        logoUrl: seller.logoUrl ?? null,
        verificationStatus: seller.verificationStatus ?? null,
        latitude: sellerLatitude,
        longitude: sellerLongitude,
        distanceKm:
          seller.distanceKm ??
          distanceKm(longitude, latitude, sellerLongitude, sellerLatitude),
      };
    })
    .filter((seller): seller is NearbySeller => seller !== null)
    // The endpoint currently ignores radiusKm and returns everyone, so the
    // radius is enforced here as well. Harmless once it filters server-side.
    .filter((seller) => (seller.distanceKm ?? 0) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return { ...res, data: sellers };
}

export async function getNearbyProducts(
  longitude: number,
  latitude: number,
  radiusKm: number
): Promise<ApiResponse<NearbyProduct[]>> {
  const res = await authedApiRequest<ApiNearbyProduct[]>(
    `/api/buyer/products?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
  );
  if (!res.success || !Array.isArray(res.data)) {
    return { ...res, data: [] } as ApiResponse<NearbyProduct[]>;
  }

  const products = res.data.map((product) =>
    mapNearbyProduct(product, { longitude, latitude })
  );

  return { ...res, data: products };
}
