import * as SQLite from "expo-sqlite";

// Local mirror of what we fetch, so a seller with no connection still sees
// their shop. Opened once and reused - opening is async, so every caller
// awaits the same promise rather than racing to open it twice.
//
// Tables are keyed by the backend's own ids, so re-syncing is an upsert
// rather than a wipe-and-insert; nothing is lost if a later sync fails.

const DATABASE_NAME = "makola.db";

// Bump this and add a migration below when the schema changes.
const SCHEMA_VERSION = 11;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * ALTER TABLE ... ADD COLUMN is not idempotent - re-running it throws
 * "duplicate column name". Migrations DO get re-run: execAsync is not atomic,
 * so if one statement fails, or the app is killed mid-migration, the version
 * isn't bumped and the whole step replays on the next launch. Checking first
 * turns a permanently broken database into a no-op.
 */
async function addColumns(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns: Record<string, string>
): Promise<void> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  const existing = new Set(rows.map((row) => row.name));
  for (const [name, definition] of Object.entries(columns)) {
    if (existing.has(name)) continue;
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

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
    await db.execAsync(`PRAGMA user_version = 1`);
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
    await db.execAsync(`PRAGMA user_version = 2`);
  }

  if (current < 3) {
    // Shops around the seller, and their products, saved alongside the map
    // tiles so the map still has something to show with no connection.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS nearby_shops (
        id                  TEXT PRIMARY KEY NOT NULL,
        shop_name           TEXT,
        logo                TEXT,
        latitude            REAL NOT NULL,
        longitude           REAL NOT NULL,
        location_name       TEXT,
        verification_status TEXT,
        distance_km         REAL,
        product_count       INTEGER NOT NULL DEFAULT 0,
        synced_at           TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nearby_products (
        id          TEXT PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        price       REAL NOT NULL DEFAULT 0,
        image       TEXT,
        category    TEXT,
        shop_name   TEXT,
        distance_km REAL,
        synced_at   TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 3`);
  }

  if (current < 4) {
    // /shops/nearby now returns each shop whole - its owner, description and
    // approved listings - so a tapped pin needs no second call. Cache the lot,
    // or the shop page is blank offline.
    await addColumns(db, "nearby_shops", {
      description: "TEXT",
      owner_name: "TEXT",
      owner_picture: "TEXT",
      owner_email: "TEXT",
      owner_phone: "TEXT",
      owner_email_verified: "INTEGER NOT NULL DEFAULT 0",
      joined_at: "TEXT",
    });
    // Which shop a cached product belongs to. shop_name alone can't do this:
    // two shops may share a name, and a listing without one can't be placed.
    await addColumns(db, "nearby_products", { shop_id: "TEXT" });
    await db.execAsync(`PRAGMA user_version = 4`);
  }

  if (current < 5) {
    // The nested listings are full product cards, so keep the whole card - a
    // shop page read from cache should look no different to one read live.
    await addColumns(db, "nearby_products", {
      description: "TEXT",
      stock: "INTEGER",
      // A JSON array. SQLite has no array type, and a separate table would be
      // three joins for something only ever read whole.
      images: "TEXT",
      status: "TEXT",
      created_at: "TEXT",
    });
    await db.execAsync(`PRAGMA user_version = 5`);
  }

  if (current < 6) {
    // The buyer's home feed, mirrored so the app opens to products rather than
    // a spinner when there's no connection.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS buyer_listings (
        id              TEXT PRIMARY KEY NOT NULL,
        name            TEXT NOT NULL,
        price           REAL NOT NULL DEFAULT 0,
        main_image      TEXT,
        seller_name     TEXT,
        owner_name      TEXT,
        owner_picture   TEXT,
        seller_phone    TEXT,
        seller_verified INTEGER NOT NULL DEFAULT 0,
        category        TEXT,
        location        TEXT,
        distance_km     REAL,
        description     TEXT,
        -- The feed's order is meaningful (the server ranks it), and neither
        -- distance nor date reproduces it, so keep the position explicitly.
        position        INTEGER NOT NULL DEFAULT 0,
        synced_at       TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 6`);
  }

  if (current < 7) {
    // A product's own page, so tapping a product in an offline shop doesn't
    // hit the network. Unlike buyer_listings this is never cleared wholesale -
    // a detail saved earlier stays useful after the feed moves on.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS product_details (
        id              TEXT PRIMARY KEY NOT NULL,
        name            TEXT NOT NULL,
        price           REAL NOT NULL DEFAULT 0,
        main_image      TEXT,
        images          TEXT,
        seller_name     TEXT,
        owner_name      TEXT,
        owner_picture   TEXT,
        seller_phone    TEXT,
        seller_verified INTEGER NOT NULL DEFAULT 0,
        category        TEXT,
        subcategory     TEXT,
        tags            TEXT,
        stock           INTEGER,
        status          TEXT,
        listed_at       TEXT,
        location        TEXT,
        distance_km     REAL,
        description     TEXT,
        synced_at       TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 7`);
  }

  if (current < 8) {
    // The buyer's saves, on the device only - there is no saved endpoint yet.
    // A row present means saved; un-saving deletes it. No sync bookkeeping,
    // because there is nothing to sync with.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_products (
        product_id TEXT PRIMARY KEY NOT NULL,
        saved_at   TEXT NOT NULL
      );

      -- Keyed client-side: a saved shop may arrive with no id, so the phone,
      -- then the name, stand in.
      CREATE TABLE IF NOT EXISTS saved_shops (
        key      TEXT PRIMARY KEY NOT NULL,
        shop_id  TEXT,
        name     TEXT NOT NULL,
        phone    TEXT,
        image    TEXT,
        saved_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 8`);
  }

  if (current < 9) {
    // A snapshot of the whole shop, so a saved shop can reopen its page - name
    // and phone alone aren't enough to render one. Stored as JSON rather than
    // twelve more columns: it is only ever read whole, by key, and pointing at
    // nearby_shops instead would break the moment the map re-syncs and replaces
    // that set.
    await addColumns(db, "saved_shops", { shop_json: "TEXT" });
    await db.execAsync(`PRAGMA user_version = 9`);
  }

  if (current < 10) {
    // Enough of the product to render its card, kept on the save row itself.
    // product_details is still what the page reads, but if that write ever
    // fails the save must not vanish from the Products tab - a save that
    // silently shows nothing is worse than a card with less on it.
    await addColumns(db, "saved_products", {
      name: "TEXT",
      price: "REAL",
      image: "TEXT",
      seller_name: "TEXT",
    });
    await db.execAsync(`PRAGMA user_version = 10`);
  }

  if (current < 11) {
    // The buyer's own profile, mirrored like the seller's so their name, photo
    // and contact details are on screen before the network answers - and still
    // there when it doesn't.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS buyer_profile (
        user_id   TEXT PRIMARY KEY NOT NULL,
        name      TEXT,
        email     TEXT,
        phone     TEXT,
        location  TEXT,
        picture   TEXT,
        synced_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 11`);
  }

  // Each step above recorded itself, so nothing here is left to do. A failure
  // part-way through now costs only the step that failed - the ones already
  // applied are not replayed on the next launch.
}

/**
 * Last resort when migration fails: drop everything and build it fresh.
 *
 * Safe because nothing in this database is the source of truth - it is a mirror
 * of the API plus the buyer's saves. Losing it costs a re-fetch. Leaving it
 * broken costs every save, every offline screen and every cached image, with no
 * way out but reinstalling the app.
 */
async function rebuild(db: SQLite.SQLiteDatabase): Promise<void> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  for (const { name } of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS "${name}"`);
  }
  await db.execAsync("PRAGMA user_version = 0");
  await migrate(db);
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      try {
        await migrate(db);
      } catch (err) {
        // A half-applied migration used to wedge the database for good: every
        // later launch replayed the failed step and threw again, so nothing
        // could read or write. Start over instead.
        console.warn("Migration failed - rebuilding the local database", err);
        await rebuild(db);
      }
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
    DELETE FROM nearby_shops;
    DELETE FROM nearby_products;
    DELETE FROM buyer_listings;
    DELETE FROM product_details;
    DELETE FROM saved_products;
    DELETE FROM saved_shops;
    DELETE FROM buyer_profile;
  `);
}
