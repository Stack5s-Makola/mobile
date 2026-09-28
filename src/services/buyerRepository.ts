import { Listing } from "../types/listing";
import { NearbyShop } from "@types/seller";
import * as api from "@services/api/listingService";
import * as nearbyService from "@services/api/nearbyService";
import { readListings, saveListings } from "@services/db/buyerCache";
import { readNearbyShops } from "@services/db/mapCache";
import { readProductDetails, saveProductDetails } from "@services/db/productCache";

// Straight read of the local mirror, for showing something before the network
// call finishes.
export { readListings as getCachedListings };

// Network first, SQLite as the fallback - the same shape as
// services/sellerRepository.ts, so both home screens behave alike. Every
// successful fetch is written to the mirror, so the last feed a buyer saw is
// what they get when the connection drops.
//
// `fromCache` lets a screen say so rather than passing stale data off as live.

export type Loaded<T> = {
  success: boolean;
  message: string;
  data: T | null;
  fromCache: boolean;
};

const OFFLINE_MESSAGE = "You're offline. Showing what we last saved.";
const NO_CACHE_MESSAGE = "You're offline and we haven't saved anything yet.";

// Wide enough to cover the shops behind a feed that isn't itself
// radius-limited, without asking the server for the whole country.
const OWNER_LOOKUP_RADIUS_KM = 50;

// Shop names are matched, not ids: /api/buyer/products doesn't expose a shop
// id. Case and spacing differ between the two endpoints often enough to matter.
function nameKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Fills in each listing's owner from /shops/nearby.
 *
 * The product endpoints don't carry the owner, so every card fell back to a
 * coloured circle with an initial. The shops endpoint does carry it, so the two
 * are joined here on shop name.
 *
 * Best-effort throughout: a failure leaves the listings exactly as they were.
 */
async function withOwners(
  listings: Listing[],
  filters: api.ProductFilters
): Promise<Listing[]> {
  // Nothing to fill - the endpoint started sending owners, or there's no feed.
  if (listings.length === 0 || listings.every((l) => l.ownerPicture)) {
    return listings;
  }

  let shops: NearbyShop[] = [];
  try {
    if (filters.latitude !== undefined && filters.longitude !== undefined) {
      const res = await nearbyService.getNearbyShops(
        filters.longitude,
        filters.latitude,
        OWNER_LOOKUP_RADIUS_KM
      );
      shops = res.success ? res.data : [];
    }
    // No point to search around, or the call failed: whatever the map last
    // saved still knows who owns what.
    if (shops.length === 0) shops = await readNearbyShops();
  } catch {
    try {
      shops = await readNearbyShops();
    } catch {
      return listings;
    }
  }
  if (shops.length === 0) return listings;

  const byName = new Map<string, NearbyShop>();
  for (const shop of shops) {
    const key = nameKey(shop.shopName);
    if (key) byName.set(key, shop);
  }

  return listings.map((listing) => {
    if (listing.ownerName && listing.ownerPicture) return listing;
    const shop = byName.get(nameKey(listing.sellerName));
    if (!shop) return listing;
    return {
      ...listing,
      ownerName: listing.ownerName ?? shop.owner?.name ?? null,
      // The shop's logo is the last resort, as on the map.
      ownerPicture:
        listing.ownerPicture ?? shop.owner?.picture ?? shop.logo ?? null,
    };
  });
}

export async function getListings(
  filters: api.ProductFilters = {}
): Promise<Loaded<Listing[]>> {
  try {
    const res = await api.getListings(filters);
    if (res.success) {
      // Owners are filled in before caching, so the stored copy shows faces
      // too rather than a grid of initials when offline.
      const listings = await withOwners(res.data, filters);
      // Cache writes must never take the screen down with them.
      saveListings(listings).catch((err) =>
        console.warn("Couldn't cache listings", err)
      );
      return { success: true, message: res.message, data: listings, fromCache: false };
    }
    // A real error from the server (a 401, say) is not an offline case - pass
    // it through rather than quietly showing stale data.
    return { success: false, message: res.message, data: null, fromCache: false };
  } catch {
    const cached = await readListings().catch(() => null);
    return {
      success: cached !== null,
      message: cached ? OFFLINE_MESSAGE : NO_CACHE_MESSAGE,
      data: cached,
      fromCache: true,
    };
  }
}

export async function getListingById(id: string): Promise<Loaded<Listing>> {
  try {
    const res = await api.getListingById(id);
    if (res.success && res.data) {
      saveProductDetails([res.data]).catch((err) =>
        console.warn("Couldn't cache product details", err)
      );
      return { success: true, message: res.message, data: res.data, fromCache: false };
    }
    // A 404 is a real answer, not an offline case - but a product saved from
    // the map is still worth showing if the server won't say.
    const cached = res.success ? null : await readProductDetails(id).catch(() => null);
    return {
      success: cached !== null,
      message: cached ? OFFLINE_MESSAGE : res.message,
      data: cached,
      fromCache: cached !== null,
    };
  } catch {
    const cached = await readProductDetails(id).catch(() => null);
    return {
      success: cached !== null,
      message: cached ? OFFLINE_MESSAGE : NO_CACHE_MESSAGE,
      data: cached,
      fromCache: true,
    };
  }
}
