import { Listing } from "../../types/listing";
import { NearbyShop } from "@types/seller";
import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";

// A product's own page, mirrored so tapping a product inside an offline shop
// doesn't need the network.
//
// Rows are upserted, never cleared wholesale: a detail saved on one trip
// through the map is still worth having after the nearby set moves on. Logout
// clears the table with the rest of the cache.

type DetailRow = {
  id: string;
  name: string;
  price: number;
  main_image: string | null;
  images: string | null;
  seller_name: string | null;
  owner_name: string | null;
  owner_picture: string | null;
  seller_phone: string | null;
  seller_verified: number;
  category: string | null;
  subcategory: string | null;
  tags: string | null;
  stock: number | null;
  status: string | null;
  listed_at: string | null;
  location: string | null;
  distance_km: number | null;
  description: string | null;
};

// Stored as JSON, so a hand-edited or truncated row mustn't throw.
function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// One query for every cached image beats one per product.
async function imageResolver(): Promise<(url: string | null) => string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ remote_url: string; local_uri: string }>(
    "SELECT remote_url, local_uri FROM cached_images"
  );
  const byUrl = new Map(rows.map((row) => [row.remote_url, row.local_uri]));
  return (url) => (url ? (byUrl.get(url) ?? url) : "");
}

export async function saveProductDetails(listings: Listing[]): Promise<void> {
  if (listings.length === 0) return;
  const db = await getDatabase();
  const syncedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const listing of listings) {
      await db.runAsync(
        `INSERT OR REPLACE INTO product_details
           (id, name, price, main_image, images, seller_name, owner_name,
            owner_picture, seller_phone, seller_verified, category, subcategory,
            tags, stock, status, listed_at, location, distance_km, description,
            synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        listing.id,
        listing.name,
        listing.price,
        listing.mainImage || null,
        listing.images && listing.images.length > 0
          ? JSON.stringify(listing.images)
          : null,
        listing.sellerName || null,
        listing.ownerName ?? null,
        listing.ownerPicture ?? null,
        listing.sellerPhone || null,
        listing.sellerVerified ? 1 : 0,
        listing.category || null,
        listing.subcategory ?? null,
        listing.tags && listing.tags.length > 0 ? JSON.stringify(listing.tags) : null,
        listing.stock ?? null,
        listing.status ?? null,
        listing.listedAt ?? null,
        listing.location || null,
        listing.distanceKm ?? null,
        listing.description ?? null,
        syncedAt
      );
    }
  });

  // Images afterwards: slow, and a failure here must not cost us the rows
  // already written.
  await Promise.all(
    listings.flatMap((listing) => {
      const uris = new Set(
        [listing.mainImage, ...(listing.images ?? []), listing.ownerPicture ?? null].filter(
          (uri): uri is string => Boolean(uri)
        )
      );
      return [...uris].map((uri) => cacheImage(uri));
    })
  );
}

export async function readProductDetails(id: string): Promise<Listing | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DetailRow>(
    "SELECT * FROM product_details WHERE id = ?",
    id
  );
  if (!row) return null;

  const localUri = await imageResolver();
  const images = parseJsonArray(row.images).map((uri) => localUri(uri));

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    mainImage: localUri(row.main_image),
    images,
    sellerName: row.seller_name ?? "",
    ownerName: row.owner_name,
    ownerPicture: row.owner_picture ? localUri(row.owner_picture) : null,
    sellerPhone: row.seller_phone ?? "",
    sellerVerified: row.seller_verified === 1,
    category: row.category ?? "",
    subcategory: row.subcategory,
    tags: parseJsonArray(row.tags),
    stock: row.stock,
    status: row.status,
    listedAt: row.listed_at,
    location: row.location ?? "",
    distanceKm: row.distance_km,
    description: row.description ?? undefined,
  };
}

/**
 * Turns the map's nearby shops into a product page per listing.
 *
 * /shops/nearby already returns each shop's listings as full cards, so this
 * needs no further requests - composing shop + listing covers everything the
 * details screen renders. Fetching each product individually would mean one
 * request per listing across every nearby shop, on a connection the buyer is
 * about to lose.
 *
 * `tags` and `subcategory` aren't on the nested cards, so those two rows are
 * absent offline until the shop payload carries them.
 */
export async function saveDetailsFromShops(shops: NearbyShop[]): Promise<void> {
  const listings: Listing[] = shops.flatMap((shop) =>
    shop.products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      mainImage: product.image ?? "",
      images: product.images ?? (product.image ? [product.image] : []),
      sellerName: shop.shopName ?? "",
      ownerName: shop.owner?.name ?? null,
      ownerPicture: shop.owner?.picture ?? shop.logo ?? null,
      // What Contact Seller dials - the shop's own number isn't on this
      // payload, so the owner's is the one to keep.
      sellerPhone: shop.owner?.phone ?? "",
      sellerVerified: shop.verificationStatus?.toUpperCase() === "VERIFIED",
      category: product.category ?? "",
      location: shop.locationName ?? "",
      distanceKm: product.distanceKm ?? shop.distanceKm ?? null,
      description: product.description ?? undefined,
      stock: product.stock ?? null,
      status: product.status ?? null,
      listedAt: product.createdAt ?? null,
    }))
  );

  await saveProductDetails(listings);
}
