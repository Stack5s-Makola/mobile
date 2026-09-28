export interface Listing {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  // The shop's name.
  sellerName: string;
  // The person behind the shop, which is not the shop's name. Optional: only
  // some product endpoints nest the owner.
  ownerName?: string | null;
  ownerPicture?: string | null;
  sellerPhone: string;
  sellerVerified: boolean;
  category: string; // category id - see src/constants/categories.ts
  location: string; // place name, e.g. "Ussher Town, Accra"
  // Present when the request carried a latitude/longitude to measure from.
  distanceKm?: number | null;
  description?: string;
  // The rest of what GET /api/buyer/products/:id returns. Optional because the
  // list endpoint sends the leaner shape.
  subcategory?: string | null;
  tags?: string[];
  stock?: number | null;
  status?: string | null;
  listedAt?: string | null;
  // Every image, not just the one the card leads with.
  images?: string[];
}
