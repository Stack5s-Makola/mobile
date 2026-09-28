import { Listing } from "../../types/listing";
import { NearbyShop } from "@types/seller";
import { SavedShop } from "@services/api/savedService";
import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";
import { readProductDetails, saveProductDetails } from "./productCache";

// The buyer's saves, on the device only - there is no saved endpoint yet, so
// nothing here talks to the network. A row present means saved; un-saving
// deletes it.
//
// Products keep only their id: the product itself lives in product_details, so
// a saved product and one opened from the map are the same row rather than two
// copies that can disagree.

// A saved shop plus the snapshot needed to reopen its page. `nearby` is null
// for a shop saved from somewhere that only knew its name and number.
export type SavedShopEntry = SavedShop & { nearby: NearbyShop | null };

// One query for every cached image beats one per row.
async function imageResolver(): Promise<(url: string | null) => string | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ remote_url: string; local_uri: string }>(
    "SELECT remote_url, local_uri FROM cached_images"
  );
  const byUrl = new Map(rows.map((row) => [row.remote_url, row.local_uri]));
  return (url) => (url ? (byUrl.get(url) ?? url) : null);
}

// Shop names are matched, not ids: the product endpoints don't expose a shop
// id. Case and spacing differ between endpoints often enough to matter.
export function shopNameKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** A saved shop may arrive without an id, so the phone, then the name, stand in. */
export function shopKey(shop: SavedShop): string {
  return (shop.id || shop.phone || shop.name || "").trim().toLowerCase();
}

export async function setProductSaved(
  listing: Listing,
  saved: boolean
): Promise<void> {
  const db = await getDatabase();
  if (!saved) {
    await db.runAsync("DELETE FROM saved_products WHERE product_id = ?", listing.id);
    return;
  }

  // The save row goes in FIRST, carrying enough to draw its card. Writing the
  // full details first meant any failure there lost the save entirely - the
  // product was never recorded and the Products tab stayed empty.
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_products
       (product_id, name, price, image, seller_name, saved_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    listing.id,
    listing.name,
    listing.price,
    listing.mainImage || null,
    listing.sellerName || null,
    new Date().toISOString()
  );

  // Then the full product, for its page. Best-effort: the save already counts.
  await saveProductDetails([listing]).catch((err) =>
    console.warn("Couldn't store details for saved product", listing.id, err)
  );
}

export async function isProductSaved(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ product_id: string }>(
    "SELECT product_id FROM saved_products WHERE product_id = ?",
    id
  );
  return row !== null && row !== undefined;
}

export async function readSavedProducts(): Promise<Listing[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    product_id: string;
    name: string | null;
    price: number | null;
    image: string | null;
    seller_name: string | null;
  }>(
    // Most recently saved first.
    "SELECT * FROM saved_products ORDER BY saved_at DESC"
  );

  const localUri = await imageResolver();

  const listings: Listing[] = [];
  for (const row of rows) {
    const full = await readProductDetails(row.product_id).catch(() => null);
    if (full) {
      listings.push(full);
      continue;
    }
    // No stored details: still show the card, from what the save row kept. A
    // save must never disappear from this tab.
    listings.push({
      id: row.product_id,
      name: row.name ?? "Saved product",
      price: row.price ?? 0,
      mainImage: localUri(row.image) ?? "",
      sellerName: row.seller_name ?? "",
      sellerPhone: "",
      sellerVerified: false,
      category: "",
      location: "",
    });
  }
  return listings;
}

export async function setShopSaved(
  shop: SavedShop,
  saved: boolean,
  // The whole shop, when the caller has it - without this the Saved page can
  // list the shop but not open its page.
  nearby?: NearbyShop | null
): Promise<void> {
  const db = await getDatabase();
  const key = shopKey(shop);
  if (!saved) {
    await db.runAsync("DELETE FROM saved_shops WHERE key = ?", key);
    return;
  }
  const image = shop.image ?? shop.photoUri ?? null;
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_shops
       (key, shop_id, name, phone, image, shop_json, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    key,
    shop.id ?? null,
    shop.name,
    shop.phone ?? null,
    image,
    nearby ? JSON.stringify(nearby) : null,
    new Date().toISOString()
  );
  // So the saved shop still has a face with no connection - its own photo, and
  // every product photo its page will need.
  await Promise.all([
    cacheImage(image),
    ...(nearby?.products ?? []).map((product) => cacheImage(product.image)),
  ]);
}

export async function isShopSaved(shop: SavedShop): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ key: string }>(
    "SELECT key FROM saved_shops WHERE key = ?",
    shopKey(shop)
  );
  return row !== null && row !== undefined;
}

export async function readSavedShops(): Promise<SavedShopEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    shop_id: string | null;
    name: string;
    phone: string | null;
    image: string | null;
    shop_json: string | null;
  }>("SELECT * FROM saved_shops ORDER BY saved_at DESC");

  // The stored URL is the remote one; offline only the downloaded copy loads.
  const localUri = await imageResolver();

  return rows.map((row) => ({
    id: row.shop_id ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    image: localUri(row.image) ?? undefined,
    nearby: parseShop(row.shop_json),
  }));
}

// Stored as JSON, so a truncated or hand-edited row mustn't throw.
function parseShop(raw: string | null): NearbyShop | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as NearbyShop) : null;
  } catch {
    return null;
  }
}
