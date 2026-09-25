import * as SQLite from "expo-sqlite";

// Local mirror of what we fetch, so a seller with no connection still sees
// their shop. Opened once and reused - opening is async, so every caller
// awaits the same promise rather than racing to open it twice.
//
// Tables are keyed by the backend's own ids, so re-syncing is an upsert
// rather than a wipe-and-insert; nothing is lost if a later sync fails.

const DATABASE_NAME = "makola.db";

// Bump this and add a migration below when the schema changes.
const SCHEMA_VERSION = 2;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- One row per signed-in seller, keyed by their backend user id so
      -- switching accounts on a shared device doesn't show the wrong shop.
      CREATE TABLE IF NOT EXISTS seller_profile (
        user_id        TEXT PRIMARY KEY NOT NULL,
        name           TEXT,
        shop_name      TEXT,
        avatar         TEXT,
        total_listings INTEGER NOT NULL DEFAULT 0,
        approved       INTEGER NOT NULL DEFAULT 0,
        pending        INTEGER NOT NULL DEFAULT 0,
        rejected       INTEGER NOT NULL DEFAULT 0,
        synced_at      TEXT NOT NULL
      );

      -- Every product we've seen for a seller. The dashboard's "recent" list
      -- is just the newest few of these, so it isn't stored separately.
      CREATE TABLE IF NOT EXISTS listings (
        id              TEXT PRIMARY KEY NOT NULL,
        user_id         TEXT NOT NULL,
        name            TEXT NOT NULL,
        price           REAL NOT NULL DEFAULT 0,
        quantity        INTEGER NOT NULL DEFAULT 0,
        image           TEXT,
        category        TEXT,
        tags            TEXT,
        status          TEXT NOT NULL DEFAULT 'pending',
        moderation_note TEXT,
        listed_at       TEXT,
        synced_at       TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS listings_by_user ON listings (user_id, listed_at DESC);

      -- Remote image URL -> file on disk, so photos survive going offline.
      CREATE TABLE IF NOT EXISTS cached_images (
        remote_url TEXT PRIMARY KEY NOT NULL,
        local_uri  TEXT NOT NULL,
        cached_at  TEXT NOT NULL
      );
    `);
  }

  if (current < 2) {
    // Mapbox stores the tiles itself; this table only records WHICH regions
    // we've asked it to keep, so the app can tell whether a place is already
    // available offline without querying the native store on every render.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_map_packs (
        name       TEXT PRIMARY KEY NOT NULL,
        user_id    TEXT NOT NULL,
        latitude   REAL NOT NULL,
        longitude  REAL NOT NULL,
        radius_km  REAL NOT NULL,
        min_zoom   INTEGER NOT NULL,
        max_zoom   INTEGER NOT NULL,
        style_url  TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS offline_map_packs_by_user
        ON offline_map_packs (user_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await migrate(db);
      return db;
    })().catch((err) => {
      // Don't cache a failed open - the next caller should get a fresh try.
      databasePromise = null;
      throw err;
    });
  }
  return databasePromise;
}

// Used on sign-out: the next seller to use this device shouldn't inherit the
// previous one's shop.
export async function clearCachedData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM seller_profile;
    DELETE FROM listings;
    DELETE FROM cached_images;
    DELETE FROM offline_map_packs;
  `);
}
