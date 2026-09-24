import { DashboardListing, SellerDashboardData } from "@types/seller";
import * as api from "@services/api/sellerService";
import { readDashboard, readListings, saveDashboard, saveListings } from "@services/db/sellerCache";

// Straight reads of the local mirror, for showing something before the
// network call finishes.
export { readDashboard as getCachedDashboard, readListings as getCachedListings };

// Network first, SQLite as the fallback. Every successful fetch is written to
// the local mirror, so the last thing a seller saw is what they get when the
// connection drops.
//
// `fromCache` lets a screen say so rather than passing stale numbers off as
// live ones.

export type Loaded<T> = {
  success: boolean;
  message: string;
  data: T | null;
  fromCache: boolean;
};

const OFFLINE_MESSAGE = "You're offline. Showing what we last saved.";
const NO_CACHE_MESSAGE = "You're offline and we haven't saved anything yet.";

export async function getDashboard(userId: string): Promise<Loaded<SellerDashboardData>> {
  try {
    const res = await api.getDashboard();
    if (res.success) {
      // Cache writes must never take the screen down with them.
      saveDashboard(userId, res.data).catch((err) =>
        console.warn("Couldn't cache dashboard", err)
      );
      return { success: true, message: res.message, data: res.data, fromCache: false };
    }
    // A real error from the server (a 401, say) is not an offline case - pass
    // it through rather than quietly showing stale data.
    return { success: false, message: res.message, data: null, fromCache: false };
  } catch {
    const cached = await readDashboard(userId).catch(() => null);
    return {
      success: cached !== null,
      message: cached ? OFFLINE_MESSAGE : NO_CACHE_MESSAGE,
      data: cached,
      fromCache: true,
    };
  }
}

export async function getMyListings(userId: string): Promise<Loaded<DashboardListing[]>> {
  try {
    const res = await api.getMyListings();
    if (res.success) {
      saveListings(userId, res.data).catch((err) =>
        console.warn("Couldn't cache listings", err)
      );
      return { success: true, message: res.message, data: res.data, fromCache: false };
    }
    return { success: false, message: res.message, data: null, fromCache: false };
  } catch {
    const cached = await readListings(userId).catch(() => null);
    return {
      success: cached !== null,
      message: cached ? OFFLINE_MESSAGE : NO_CACHE_MESSAGE,
      data: cached,
      fromCache: true,
    };
  }
}
