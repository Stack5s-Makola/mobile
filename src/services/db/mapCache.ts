import Mapbox from "@rnmapbox/maps";
import { getDatabase } from "./database";

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
