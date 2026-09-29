import Mapbox from "@rnmapbox/maps";
import { NearbyProduct, NearbyShop } from "@types/seller";
import * as nearbyService from "@services/api/nearbyService";
import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";
import { saveDetailsFromShops } from "./productCache";

// Keeps a small area of the map available with no connection.
//
// Mapbox downloads and stores the tiles itself - we can't put them in SQLite.
// What we store is a record of which regions we've asked for, so the app can
// answer "is this place already offline?" without hitting the native store,
// and so a pack isn't downloaded twice.

// 2km around the seller - about 80 tiles (~4MB). Zoom 16 is roughly street
// level; each level past it quadruples the tile count, and Mapbox caps a pack
// at 6000 tiles.
export const OFFLINE_RADIUS_KM = 2;
const MIN_ZOOM = 10;
const MAX_ZOOM = 16;

const KM_PER_DEGREE_LATITUDE = 111.32;

export type OfflinePackRecord = {
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  status: string;
  createdAt: string;
};

// One pack per seller, replaced if they move far enough away.
function packNameFor(userId: string): string {
  return `shop-${userId}`;
}

/**
 * A square bounding box of `radiusKm` around a point, as Mapbox wants it:
 * [[northEastLng, northEastLat], [southWestLng, southWestLat]].
 *
 * Longitude degrees shrink as you move away from the equator, so the
 * longitude span is divided by cos(latitude) - without that the box would be
 * too narrow east-to-west.
 */
export function boundsAround(
  longitude: number,
  latitude: number,
  radiusKm: number
): [[number, number], [number, number]] {
  const latitudeDelta = radiusKm / KM_PER_DEGREE_LATITUDE;
  const longitudeDelta =
    radiusKm / (KM_PER_DEGREE_LATITUDE * Math.cos((latitude * Math.PI) / 180));

  return [
    [longitude + longitudeDelta, latitude + latitudeDelta],
    [longitude - longitudeDelta, latitude - latitudeDelta],
  ];
}

// Rough great-circle distance, good enough to decide whether an existing pack
// still covers where the seller is now.
function distanceKm(
  aLng: number,
  aLat: number,
  bLng: number,
  bLat: number
): number {
  const latitudeKm = (aLat - bLat) * KM_PER_DEGREE_LATITUDE;
  const longitudeKm =
    (aLng - bLng) * KM_PER_DEGREE_LATITUDE * Math.cos((aLat * Math.PI) / 180);
  return Math.sqrt(latitudeKm * latitudeKm + longitudeKm * longitudeKm);
}

export async function readPack(userId: string): Promise<OfflinePackRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    name: string;
    latitude: number;
    longitude: number;
    radius_km: number;
    status: string;
    created_at: string;
  }>("SELECT * FROM offline_map_packs WHERE user_id = ?", userId);

  if (!row) return null;
  return {
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusKm: row.radius_km,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function savePack(
  userId: string,
  name: string,
  longitude: number,
  latitude: number,
  status: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO offline_map_packs
       (name, user_id, latitude, longitude, radius_km, min_zoom, max_zoom, style_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    name,
    userId,
    latitude,
    longitude,
    OFFLINE_RADIUS_KM,
    MIN_ZOOM,
    MAX_ZOOM,
    Mapbox.StyleURL.Light,
    status,
    new Date().toISOString()
  );
}

/**
 * Downloads the area around a point for offline use, unless an existing pack
 * already covers it. Resolves once the download has been *started*; progress
 * arrives through `onProgress`.
 */
export type OfflinePackOutcome = "cached" | "downloading" | "failed";

export async function ensureOfflinePack(
  userId: string,
  [longitude, latitude]: [number, number],
  onProgress?: (percentage: number) => void
): Promise<OfflinePackOutcome> {
  const name = packNameFor(userId);

  try {
    const existing = await readPack(userId);
    if (existing && existing.status === "ready") {
      const movedKm = distanceKm(longitude, latitude, existing.longitude, existing.latitude);
      // Still inside what we already hold - nothing to do.
      if (movedKm < OFFLINE_RADIUS_KM / 2) return "cached";
      // They've moved on; drop the old area before taking a new one.
      await Mapbox.offlineManager.deletePack(name).catch(() => {});
    }

    await savePack(userId, name, longitude, latitude, "downloading");

    await Mapbox.offlineManager.createPack(
      {
        name,
        styleURL: Mapbox.StyleURL.Light,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        bounds: boundsAround(longitude, latitude, OFFLINE_RADIUS_KM),
      },
      (_pack, status) => {
        onProgress?.(status.percentage);
        if (status.percentage >= 100) {
          savePack(userId, name, longitude, latitude, "ready").catch(() => {});
        }
      },
      () => {
        savePack(userId, name, longitude, latitude, "failed").catch(() => {});
      }
    );
    return "downloading";
  } catch (err) {
    // Offline maps are a bonus - never let a failure here break the screen.
    console.warn("Couldn't prepare the offline map", err);
    await savePack(userId, name, longitude, latitude, "failed").catch(() => {});
    return "failed";
  }
}


// --- nearby shops and products ----------------------------------------
//
// Saved alongside the tiles: a map with no shops on it isn't much use
// offline. The radius here is the one the map SEARCHES (wider than the tile
// pack), because the rows are tiny compared with the tiles - the worst case
// is a marker sitting on a blank basemap if the seller pans far enough.

// A product's images, with the lead one included - `images` is the full set on
// a card from /shops/nearby, but the leaner list only has `image`.
function imagesOf(product: NearbyProduct): string[] {
  const all = [product.image, ...(product.images ?? [])].filter(
    (uri): uri is string => Boolean(uri)
  );
  return Array.from(new Set(all));
}

// Stored as JSON, so a hand-edited or truncated row mustn't throw.
function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

export async function saveNearby(
  shops: NearbyShop[],
  products: NearbyProduct[]
): Promise<void> {
  const db = await getDatabase();
  const syncedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Replace wholesale - a shop that's no longer nearby shouldn't linger.
    await db.runAsync("DELETE FROM nearby_shops");
    await db.runAsync("DELETE FROM nearby_products");

    for (const shop of shops) {
      await db.runAsync(
        `INSERT OR REPLACE INTO nearby_shops
           (id, shop_name, logo, description, latitude, longitude, location_name,
            verification_status, distance_km, product_count, owner_name,
            owner_picture, owner_email, owner_phone, owner_email_verified,
            joined_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        shop.id,
        shop.shopName,
        shop.logo,
        shop.description,
        shop.latitude,
        shop.longitude,
        shop.locationName,
        shop.verificationStatus,
        shop.distanceKm,
        shop.productCount,
        shop.owner?.name ?? null,
        shop.owner?.picture ?? null,
        shop.owner?.email ?? null,
        shop.owner?.phone ?? null,
        shop.owner?.emailVerified ? 1 : 0,
        shop.joinedAt,
        syncedAt
      );
    }

    // A shop's own listings go in the same table as the standalone nearby
    // list, tagged with shop_id so the shop page can read just its own. The
    // two sources overlap, so INSERT OR REPLACE dedupes by product id.
    const rows = [
      ...products.map((product) => ({ product, shopId: null as string | null })),
      ...shops.flatMap((shop) =>
        shop.products.map((product) => ({ product, shopId: shop.id }))
      ),
    ];

    for (const { product, shopId } of rows) {
      await db.runAsync(
        `INSERT OR REPLACE INTO nearby_products
           (id, name, price, image, images, category, description, stock, status,
            created_at, shop_name, distance_km, shop_id, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                 -- Keep a shop_id we already have if this row came from the
                 -- standalone list second, where it is null.
                 COALESCE(?, (SELECT shop_id FROM nearby_products WHERE id = ?)), ?)`,
        product.id,
        product.name,
        product.price,
        product.image,
        product.images && product.images.length > 0
          ? JSON.stringify(product.images)
          : null,
        product.category,
        product.description ?? null,
        product.stock ?? null,
        product.status ?? null,
        product.createdAt ?? null,
        product.shopName,
        product.distanceKm,
        shopId,
        product.id,
        syncedAt
      );
    }
  });

  // A product page per listing, so tapping a product inside an offline shop
  // doesn't need the network. Composed from the cards already in hand - no
  // extra requests.
  await saveDetailsFromShops(shops).catch((err) =>
    console.warn("Couldn't cache product details", err)
  );

  // Logos and product photos afterwards: slow, and a failure here must not
  // cost us the rows already written.
  await Promise.all([
    ...shops.map((shop) => cacheImage(shop.logo)),
    // The owner's photo is what a marker shows when there's no logo, so it
    // has to be on disk too or the pins go blank offline.
    ...shops.map((shop) => cacheImage(shop.owner?.picture ?? null)),
    ...shops.flatMap((shop) =>
      shop.products.flatMap((p) => imagesOf(p).map((uri) => cacheImage(uri)))
    ),
    ...products.flatMap((product) => imagesOf(product).map((uri) => cacheImage(uri))),
  ]);
}

export async function readNearbyShops(): Promise<NearbyShop[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    shop_name: string | null;
    logo: string | null;
    description: string | null;
    latitude: number;
    longitude: number;
    location_name: string | null;
    verification_status: string | null;
    distance_km: number | null;
    product_count: number;
    owner_name: string | null;
    owner_picture: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    owner_email_verified: number;
    joined_at: string | null;
  }>("SELECT * FROM nearby_shops ORDER BY distance_km ASC");

  // Each shop's listings in one query rather than one per shop.
  const products = await readNearbyProducts();
  const byShop = new Map<string, NearbyProduct[]>();
  for (const product of products) {
    if (!product.shopId) continue;
    const list = byShop.get(product.shopId);
    if (list) list.push(product);
    else byShop.set(product.shopId, [product]);
  }

  return rows.map((row) => ({
    id: row.id,
    shopName: row.shop_name,
    logo: row.logo,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    verificationStatus: row.verification_status,
    distanceKm: row.distance_km,
    productCount: row.product_count,
    owner: row.owner_name || row.owner_picture || row.owner_email || row.owner_phone
      ? {
          name: row.owner_name,
          picture: row.owner_picture,
          email: row.owner_email,
          phone: row.owner_phone,
          emailVerified: row.owner_email_verified === 1,
        }
      : null,
    joinedAt: row.joined_at,
    products: byShop.get(row.id) ?? [],
  }));
}

export async function readNearbyProducts(): Promise<NearbyProduct[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    category: string | null;
    shop_name: string | null;
    distance_km: number | null;
    shop_id: string | null;
    images: string | null;
    description: string | null;
    stock: number | null;
    status: string | null;
    created_at: string | null;
  }>("SELECT * FROM nearby_products ORDER BY distance_km ASC");

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    image: row.image,
    images: parseImages(row.images),
    category: row.category,
    description: row.description,
    stock: row.stock,
    status: row.status,
    createdAt: row.created_at,
    shopName: row.shop_name,
    distanceKm: row.distance_km,
    shopId: row.shop_id,
  }));
}

/** Fetches the area's shops and products and stores them for offline use. */
export async function cacheNearby(
  longitude: number,
  latitude: number,
  radiusKm: number
): Promise<void> {
  try {
    const [shops, products] = await Promise.all([
      nearbyService.getNearbyShops(longitude, latitude, radiusKm),
      nearbyService.getNearbyProducts(longitude, latitude, radiusKm),
    ]);
    if (!shops.success && !products.success) return;
    await saveNearby(shops.data ?? [], products.data ?? []);
  } catch (err) {
    // Offline data is a bonus - never let this break the screen.
    console.warn("Couldn't cache nearby shops", err);
  }
}
