import { Listing } from "../types/listing";
import { NearbyShop } from "@types/seller";
import { SavedShop } from "@services/api/savedService";
import * as cache from "@services/db/savedCache";
import { readNearbyShops } from "@services/db/mapCache";

// Saves are held on the device and nowhere else: there is no saved endpoint
// yet, so nothing here touches the network. That also means the heart works
// offline and the Saved page always has something to show.
//
// When the endpoint arrives, this is the one file that changes - the screens
// already go through it.

/** Flips the save and reports the new state. */
export async function toggleSavedProduct(
  listing: Listing
): Promise<{ saved: boolean }> {
  const next = !(await cache.isProductSaved(listing.id));
  await cache.setProductSaved(listing, next);
  return { saved: next };
}

export async function toggleSavedShop(
  shop: SavedShop,
  // Pass the whole shop where it's known, so the Saved page can reopen it.
  nearby?: NearbyShop | null
): Promise<{ saved: boolean }> {
  const next = !(await cache.isShopSaved(shop));
  await cache.setShopSaved(shop, next, nearby);
  return { saved: next };
}

/**
 * The real shop behind a product, by name.
 *
 * A shop is a container - its location, its owner, its whole product list. A
 * product page only knows the shop's name, so saving from there used to store a
 * stub: a name with no products, which couldn't open a shop page and read as an
 * empty row in the Saved list. This finds the actual shop the map cached, so
 * what gets saved is the container rather than something inferred from one item
 * inside it.
 *
 * Returns null when the shop isn't cached - the caller decides what to do, but
 * it must not invent one.
 */
export async function findShopByName(name: string): Promise<NearbyShop | null> {
  if (!name.trim()) return null;
  const shops = await readNearbyShops().catch(() => []);
  const key = cache.shopNameKey(name);
  return shops.find((shop) => cache.shopNameKey(shop.shopName) === key) ?? null;
}

export const isProductSaved = cache.isProductSaved;
export const isShopSaved = cache.isShopSaved;
export const getSavedProducts = cache.readSavedProducts;
export const getSavedShops = cache.readSavedShops;
export type { SavedShopEntry } from "@services/db/savedCache";
