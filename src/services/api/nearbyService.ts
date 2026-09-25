import { ApiResponse } from "@types/api";
import { NearbyProduct, NearbySeller, NearbyShop } from "@types/seller";
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
  category?: string | null;
  distanceKm?: number | null;
  seller?: { shopName?: string | null } | null;
  shop?: { shopName?: string | null } | null;
  location?: { latitude?: number | null; longitude?: number | null } | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

type ApiNearbyShop = {
  id: string;
  shopName?: string | null;
  logo?: string | null;
  locationName?: string | null;
  verificationStatus?: string | null;
  distanceKm?: number | null;
  productCount?: number | null;
  location?: { latitude?: number | string | null; longitude?: number | string | null } | null;
};

/**
 * Shops around a point. Prefers GET /api/buyer/shops/nearby, which filters by
 * radius and returns a real distance, a place name and a product count.
 *
 * That endpoint is not deployed yet (404), so this falls back to
 * /api/sellers/nearby - which ignores its parameters, so the radius and the
 * distance are applied on the client. Drop the fallback once the proper one
 * ships.
 */
export async function getNearbyShops(
  longitude: number,
  latitude: number,
  radiusKm: number
): Promise<ApiResponse<NearbyShop[]>> {
  const res = await authedApiRequest<ApiNearbyShop[]>(
    `/api/buyer/shops/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
  );

  if (res.success && Array.isArray(res.data)) {
    const shops = res.data
      .map((shop): NearbyShop | null => {
        const shopLatitude = toCoordinate(shop.location?.latitude);
        const shopLongitude = toCoordinate(shop.location?.longitude);
        if (shopLatitude === null || shopLongitude === null) return null;
        return {
          id: shop.id,
          shopName: shop.shopName ?? null,
          logo: shop.logo ?? null,
          latitude: shopLatitude,
          longitude: shopLongitude,
          locationName: shop.locationName ?? null,
          verificationStatus: shop.verificationStatus ?? null,
          distanceKm:
            shop.distanceKm ??
            distanceKm(longitude, latitude, shopLongitude, shopLatitude),
          productCount: shop.productCount ?? 0,
        };
      })
      .filter((shop): shop is NearbyShop => shop !== null);
    return { ...res, data: shops };
  }

  const fallback = await getNearbySellers(longitude, latitude, radiusKm);
  return {
    ...fallback,
    data: fallback.data.map((seller) => ({
      id: seller.id,
      shopName: seller.shopName,
      logo: seller.logoUrl,
      latitude: seller.latitude,
      longitude: seller.longitude,
      // Neither is available from the older endpoint.
      locationName: null,
      verificationStatus: seller.verificationStatus,
      distanceKm: seller.distanceKm,
      productCount: 0,
    })),
  };
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

  const products = res.data.map((product): NearbyProduct => {
    const productLatitude = toCoordinate(product.location?.latitude);
    const productLongitude = toCoordinate(product.location?.longitude);
    const computed =
      productLatitude !== null && productLongitude !== null
        ? distanceKm(longitude, latitude, productLongitude, productLatitude)
        : null;

    return {
      id: product.id,
      name: product.name,
      price: toNumber(product.price),
      image: product.imageUrl ?? product.image ?? null,
      category: product.category ?? null,
      shopName: product.shop?.shopName ?? product.seller?.shopName ?? null,
      distanceKm: product.distanceKm ?? computed,
    };
  });

  return { ...res, data: products };
}
