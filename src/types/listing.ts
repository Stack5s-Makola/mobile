export interface Listing {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  sellerName: string;
  sellerPhone: string;
  sellerVerified: boolean;
  category: string; // category id - see src/constants/categories.ts
  location: string; // city/area, e.g. "Madina"
  description?: string;
}
