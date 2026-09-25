import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiResponse } from "../../types/api";
import { authedApiRequest } from "./client";
import { Listing } from "../../types/listing";
import { readStoredSession } from "@services/session";

export interface SavedShop {
  id?: string;
  name: string;
  phone?: string;
  image?: string;
  photoUri?: string;
}

const SAVED_PRODUCTS_CACHE_KEY = "makola_saved_products_cache";
const SAVED_SHOPS_CACHE_KEY = "makola_saved_shops_cache";

async function getCacheKey(base: string): Promise<string> {
  const session = await readStoredSession();
  return `${base}:${session?.user.id ?? "anonymous"}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getSavedProducts(): Promise<ApiResponse<Listing[]>> {
  const res = await authedApiRequest<Listing[]>("/api/buyer/saved/products");
  const cacheKey = await getCacheKey(SAVED_PRODUCTS_CACHE_KEY);
  if (res.success) {
    await writeCache(cacheKey, res.data);
    return res;
  }
  const cached = await readCache<Listing[]>(cacheKey);
  return cached
    ? { success: true, message: "Showing saved products offline", data: cached }
    : res;
}

export async function toggleSavedProduct(
  id: string,
): Promise<ApiResponse<{ saved: boolean }>> {
  const res = await authedApiRequest<{ saved: boolean }>(
    `/api/buyer/saved/products/${encodeURIComponent(id)}`,
    { method: "POST" },
  );
  if (res.success && !res.data.saved) {
    const cacheKey = await getCacheKey(SAVED_PRODUCTS_CACHE_KEY);
    const cached = await readCache<Listing[]>(cacheKey);
    if (cached) {
      await writeCache(
        cacheKey,
        cached.filter((product) => product.id !== id),
      );
    }
  }
  return res;
}

export async function getSavedShops(): Promise<ApiResponse<SavedShop[]>> {
  const res = await authedApiRequest<SavedShop[]>("/api/buyer/saved/shops");
  const cacheKey = await getCacheKey(SAVED_SHOPS_CACHE_KEY);
  if (res.success) {
    await writeCache(cacheKey, res.data);
    return res;
  }
  const cached = await readCache<SavedShop[]>(cacheKey);
  return cached
    ? { success: true, message: "Showing saved shops offline", data: cached }
    : res;
}

export async function toggleSavedShop(
  shop: SavedShop,
): Promise<ApiResponse<{ saved: boolean }>> {
  const res = await authedApiRequest<{ saved: boolean }>(
    `/api/buyer/saved/shops`,
    {
      method: "POST",
      body: JSON.stringify(shop),
    },
  );
  if (res.success) {
    const cacheKey = await getCacheKey(SAVED_SHOPS_CACHE_KEY);
    const cached = (await readCache<SavedShop[]>(cacheKey)) ?? [];
    const matches = (saved: SavedShop) =>
      (!!saved.id && !!shop.id && saved.id === shop.id) ||
      (!!saved.phone && saved.phone === shop.phone);
    const next = res.data.saved
      ? [...cached.filter((saved) => !matches(saved)), shop]
      : cached.filter((saved) => !matches(saved));
    await writeCache(cacheKey, next);
  }
  return res;
}
