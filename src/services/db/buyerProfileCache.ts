import { getDatabase } from "./database";
import { cacheImage } from "./imageCache";

// The buyer's own profile, mirrored to SQLite so their name, photo and contact
// details are on screen before the network answers - and still there when it
// doesn't. Keyed by backend user id, like the seller's copy, so two accounts on
// one device never show each other's details.

export type CachedBuyerProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  picture: string | null;
};

export async function saveProfile(
  userId: string,
  profile: CachedBuyerProfile
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO buyer_profile
       (user_id, name, email, phone, location, picture, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    userId,
    profile.name || null,
    profile.email || null,
    profile.phone || null,
    profile.location || null,
    profile.picture,
    new Date().toISOString()
  );

  // So the avatar still renders with no connection.
  await cacheImage(profile.picture);
}

export async function readProfile(userId: string): Promise<CachedBuyerProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    picture: string | null;
  }>("SELECT * FROM buyer_profile WHERE user_id = ?", userId);
  if (!row) return null;

  // Prefer the downloaded copy - the stored URL won't load offline.
  let picture = row.picture;
  if (picture) {
    const local = await db.getFirstAsync<{ local_uri: string }>(
      "SELECT local_uri FROM cached_images WHERE remote_url = ?",
      picture
    );
    if (local) picture = local.local_uri;
  }

  return {
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    picture,
  };
}
