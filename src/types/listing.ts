export interface Listing {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  sellerName: string;
  sellerPhone: string;
  sellerVerified: boolean;
  category: string; // category id - see src/constants/categories.ts
  location: string; // place name, e.g. "Ussher Town, Accra"
  // Present when the request carried a latitude/longitude to measure from.
  distanceKm?: number | null;
  description?: string;
}
