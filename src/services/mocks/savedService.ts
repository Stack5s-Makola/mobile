import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiResponse } from "@types/api";

// AsyncStorage-backed rather than in-memory, since saved items should
// survive app restarts even before a backend exists. The architecture
// doc's SavedProduct/SavedSeller entities imply this eventually syncs to
// the backend per-account - src/services/api/savedService.ts is the
// same-shaped counterpart for that, once it exists.

const PRODUCT_IDS_KEY = "makola_saved_product_ids";
const SELLERS_KEY = "makola_saved_sellers";

export interface SavedSeller {
  name: string;
  phone: string;
}

async function readIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PRODUCT_IDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function readSellers(): Promise<SavedSeller[]> {
  const raw = await AsyncStorage.getItem(SELLERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getSavedProductIds(): Promise<ApiResponse<string[]>> {
  return { success: true, message: "OK", data: await readIds() };
}

export async function toggleSavedProduct(id: string): Promise<ApiResponse<{ saved: boolean }>> {
  const ids = await readIds();
  const isSaved = ids.includes(id);
  const next = isSaved ? ids.filter((i) => i !== id) : [...ids, id];
  await AsyncStorage.setItem(PRODUCT_IDS_KEY, JSON.stringify(next));
  return { success: true, message: "OK", data: { saved: !isSaved } };
}

export async function getSavedSellers(): Promise<ApiResponse<SavedSeller[]>> {
  return { success: true, message: "OK", data: await readSellers() };
}

export async function toggleSavedSeller(
  seller: SavedSeller
): Promise<ApiResponse<{ saved: boolean }>> {
  const sellers = await readSellers();
  const isSaved = sellers.some((s) => s.phone === seller.phone);
  const next = isSaved ? sellers.filter((s) => s.phone !== seller.phone) : [...sellers, seller];
  await AsyncStorage.setItem(SELLERS_KEY, JSON.stringify(next));
  return { success: true, message: "OK", data: { saved: !isSaved } };
}

export async function isProductSaved(id: string): Promise<boolean> {
  return (await readIds()).includes(id);
}

export async function isSellerSaved(phone: string): Promise<boolean> {
  return (await readSellers()).some((s) => s.phone === phone);
}
