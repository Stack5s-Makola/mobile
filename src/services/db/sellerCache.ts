import { DashboardListing, ListingApprovalStatus, SellerDashboardData } from "@types/seller";
import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";

// Reads and writes the seller's shop to SQLite. Rows are keyed by the backend
// user id so two sellers sharing a device never see each other's data.

type ListingRow = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  status: string;
};

type ProfileRow = {
  name: string | null;
  shop_name: string | null;
  avatar: string | null;
  total_listings: number;
  approved: number;
  pending: number;
  rejected: number;
};

function toStatus(raw: string): ListingApprovalStatus {
  return raw === "approved" || raw === "rejected" ? raw : "pending";
}

// One query for every cached image beats one per listing.
async function imageResolver(): Promise<(url: string | null) => string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ remote_url: string; local_uri: string }>(
    "SELECT remote_url, local_uri FROM cached_images"
  );
  const byUrl = new Map(rows.map((row) => [row.remote_url, row.local_uri]));
  return (url) => (url ? byUrl.get(url) ?? url : "");
}

export async function saveListings(
  userId: string,
  listings: DashboardListing[]
): Promise<void> {
  const db = await getDatabase();
  const syncedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Anything the server no longer returns was deleted elsewhere, so replace
    // this seller's set wholesale rather than leaving orphans behind.
    await db.runAsync("DELETE FROM listings WHERE user_id = ?", userId);
    for (const listing of listings) {
      await db.runAsync(
        `INSERT OR REPLACE INTO listings
           (id, user_id, name, price, image, status, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        listing.id,
        userId,
        listing.name,
        listing.price,
        listing.image || null,
        listing.status,
        syncedAt
      );
    }
  });

  // Pull the photos down afterwards: slow, and a failure here must not cost us
  // the rows we just wrote.
  await Promise.all(listings.map((listing) => cacheImage(listing.image)));
}

export async function readListings(userId: string): Promise<DashboardListing[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ListingRow>(
    // rowid ASC preserves the order the server sent, which is newest-first.
    // NOT listed_at: DashboardListing doesn't carry it, so that column is
    // always NULL and sorting on it silently reversed the list.
    "SELECT id, name, price, image, status FROM listings WHERE user_id = ? ORDER BY rowid ASC",
    userId
  );
  const resolve = await imageResolver();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    image: resolve(row.image),
    // Listings carry no location of their own; screens fall back to the shop's.
    location: "",
    status: toStatus(row.status),
  }));
}

export async function saveDashboard(
  userId: string,
  dashboard: SellerDashboardData
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO seller_profile
       (user_id, name, shop_name, avatar, total_listings, approved, pending, rejected, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    userId,
    dashboard.name ?? null,
    dashboard.shopName ?? null,
    dashboard.avatar ?? null,
    dashboard.totalListings,
    dashboard.approved,
    dashboard.pending,
    dashboard.rejected,
    new Date().toISOString()
  );

  await saveListings(userId, dashboard.recentListings);
  await cacheImage(dashboard.avatar);
}

export async function readDashboard(userId: string): Promise<SellerDashboardData | null> {
  const db = await getDatabase();
  const profile = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM seller_profile WHERE user_id = ?",
    userId
  );
  if (!profile) return null;

  const resolve = await imageResolver();
  const listings = await readListings(userId);

  return {
    name: profile.name ?? "",
    shopName: profile.shop_name ?? "",
    avatar: profile.avatar ? resolve(profile.avatar) : null,
    totalListings: profile.total_listings,
    approved: profile.approved,
    pending: profile.pending,
    rejected: profile.rejected,
    // The dashboard only ever shows the newest few.
    recentListings: listings.slice(0, 5),
  };
}
