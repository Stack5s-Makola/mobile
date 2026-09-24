import { Directory, File, Paths } from "expo-file-system";
import { getDatabase } from "./database";

// Remote images (Cloudinary) are copied into the app's document directory so
// they still render with no connection. The URL -> local path mapping lives
// in SQLite; the bytes live on disk.
//
// Document rather than cache directory on purpose: the OS may evict the cache
// directory under storage pressure, which would empty a seller's shop exactly
// when they're offline.

const DIRECTORY_NAME = "cached-images";

function imagesDirectory(): Directory {
  const dir = new Directory(Paths.document, DIRECTORY_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

// Cloudinary URLs end in a unique id, but fall back to a hash of the whole URL
// so any host works and one file can't clobber another.
function fileNameFor(url: string): string {
  const withoutQuery = url.split("?")[0] ?? url;
  const last = withoutQuery.split("/").pop() ?? "";
  const extension = /\.(jpg|jpeg|png|webp|heic)$/i.exec(last)?.[1]?.toLowerCase() ?? "jpg";

  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return `${Math.abs(hash).toString(36)}.${extension}`;
}

async function readCached(url: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ local_uri: string }>(
    "SELECT local_uri FROM cached_images WHERE remote_url = ?",
    url
  );
  if (!row) return null;
  // The row can outlive the file (app reinstall, manual clear), so trust the
  // disk rather than the table.
  return new File(row.local_uri).exists ? row.local_uri : null;
}

/**
 * Returns a local file URI for a remote image, downloading it the first time.
 * Falls back to the remote URL if the download fails, so an image that can't
 * be cached still renders while online.
 */
export async function cacheImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  // Already a local file (a freshly picked photo), nothing to do.
  if (url.startsWith("file://")) return url;

  try {
    const existing = await readCached(url);
    if (existing) return existing;

    const destination = new File(imagesDirectory(), fileNameFor(url));
    if (destination.exists) destination.delete();
    const downloaded = await File.downloadFileAsync(url, destination);

    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO cached_images (remote_url, local_uri, cached_at) VALUES (?, ?, ?)",
      url,
      downloaded.uri,
      new Date().toISOString()
    );
    return downloaded.uri;
  } catch (err) {
    console.warn("Couldn't cache image", url, err);
    return url;
  }
}

/** The local copy if we have one, otherwise the remote URL. Never downloads. */
export async function localImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("file://")) return url;
  try {
    return (await readCached(url)) ?? url;
  } catch {
    return url;
  }
}

// Called alongside clearCachedData on sign-out.
export function clearCachedImages(): void {
  try {
    const dir = new Directory(Paths.document, DIRECTORY_NAME);
    if (dir.exists) dir.delete();
  } catch (err) {
    console.warn("Couldn't clear cached images", err);
  }
}
