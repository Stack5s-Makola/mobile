import { Listing } from "../../types/listing";
import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";

// Reads and writes the buyer's home feed to SQLite, so the app opens to
// products rather than a spinner when there's no connection.
//
// Not keyed by user id, unlike the seller's mirror: the feed is the same public
// catalogue for everyone, so there's nothing to keep apart between accounts.
// It is cleared on logout with the rest of the cache.

type ListingRow = {
  id: string;
  name: string;
  price: number;
  main_image: string | null;
  seller_name: string | null;
  owner_name: string | null;
  owner_picture: string | null;
  seller_phone: string | null;
  seller_verified: number;
  category: string | null;
  location: string | null;
  distance_km: number | null;
  description: string | null;
};

// One query for every cached image beats one per listing.
async function imageResolver(): Promise<(url: string | null) => string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ remote_url: string; local_uri: string }>(
    "SELECT remote_url, local_uri FROM cached_images"
  );
  const byUrl = new Map(rows.map((row) => [row.remote_url, row.local_uri]));
  return (url) => (url ? (byUrl.get(url) ?? url) : "");
}

export async function saveListings(listings: Listing[]): Promise<void> {
  const db = await getDatabase();
  const syncedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Anything the server no longer returns is gone, so replace the set
    // wholesale rather than leaving orphans in the feed.
    await db.runAsync("DELETE FROM buyer_listings");

    for (const [position, listing] of listings.entries()) {
      await db.runAsync(
        `INSERT OR REPLACE INTO buyer_listings
           (id, name, price, main_image, seller_name, owner_name, owner_picture,
            seller_phone, seller_verified, category, location, distance_km,
            description, position, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        listing.id,
        listing.name,
        listing.price,
        listing.mainImage || null,
        listing.sellerName || null,
        listing.ownerName ?? null,
        listing.ownerPicture ?? null,
        listing.sellerPhone || null,
        listing.sellerVerified ? 1 : 0,
        listing.category || null,
        listing.location || null,
        listing.distanceKm ?? null,
        listing.description ?? null,
        position,
        syncedAt
      );
    }
  });

  // Images afterwards: slow, and a failure here must not cost us the rows
  // already written. The owner's photo matters as much as the product's now
  // that the card shows it.
  await Promise.all([
    ...listings.map((listing) => cacheImage(listing.mainImage || null)),
    ...listings.map((listing) => cacheImage(listing.ownerPicture ?? null)),
  ]);
}

export async function readListings(): Promise<Listing[] | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ListingRow>(
    // The server's ranking, preserved.
    "SELECT * FROM buyer_listings ORDER BY position ASC"
  );
  // null, not [], so the caller can tell "nothing saved yet" from "saved, and
  // the feed really was empty".
  if (rows.length === 0) return null;

  const localUri = await imageResolver();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    mainImage: localUri(row.main_image),
    sellerName: row.seller_name ?? "",
    ownerName: row.owner_name,
    ownerPicture: row.owner_picture ? localUri(row.owner_picture) : null,
    sellerPhone: row.seller_phone ?? "",
    sellerVerified: row.seller_verified === 1,
    category: row.category ?? "",
    location: row.location ?? "",
    distanceKm: row.distance_km,
    description: row.description ?? undefined,
  }));
}
