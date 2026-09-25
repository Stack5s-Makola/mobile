// Seller-side domain types. Field names follow the conventions of the
// rest of src/types (camelCase, ISO date strings) - confirm against
// Promise's Seller DTOs when those endpoints land and adjust here only.

export type ListingStatus = "ACTIVE" | "DRAFT" | "SOLD_OUT";

export interface SellerListing {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[]; // first image is the main image buyers see
  status: ListingStatus;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// SOLD_OUT is derived server-side from stock, so sellers only choose
// between publishing (ACTIVE) and keeping a draft.
export interface ListingPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  status: Exclude<ListingStatus, "SOLD_OUT">;
}

export interface Shop {
  id: string;
  businessName: string;
  description: string;
  location: string;
  phone: string;
  photoUri?: string;
  categories: string[];
  openingHours: string;
  isOpen: boolean;
}

export type UpdateShopPayload = Partial<Omit<Shop, "id">>;

export type VerificationStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";

export type VerificationDocumentType =
  | "GHANA_CARD"
  | "PASSPORT"
  | "VOTERS_ID"
  | "DRIVERS_LICENSE";

export interface Verification {
  status: VerificationStatus;
  documentType?: VerificationDocumentType;
  idNumber?: string;
  documentUri?: string;
  selfieUri?: string;
  submittedAt?: string;
  rejectionReason?: string;
}

export interface SubmitVerificationPayload {
  documentType: VerificationDocumentType;
  idNumber: string;
  documentUri: string;
  selfieUri: string;
}

// GET /api/seller/dashboard - confirmed live. This is the real payload;
// SellerDashboard below is the older mock-only shape still used by the
// mock service.
export type ListingApprovalStatus = "pending" | "approved" | "rejected";

export interface DashboardListing {
  id: string;
  name: string;
  price: number;
  image: string; // "" when the product has none
  location: string; // "" when unknown - the row hides it
  status: ListingApprovalStatus;
}

// GET /api/buyer/products/:id - confirmed live. Works with a seller's token
// and returns their own pending products, so the seller side uses it to show
// a listing exactly as a buyer would see it.
//
// location is coordinates only - no place name.
//
// description is optional because the API does not return it yet: /api/seller/add
// accepts the field without complaint but drops it, and this payload has no
// `description` key at all. Declared so the screen lights up the moment the
// backend starts sending one.
export interface ProductDetails {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  status: ListingApprovalStatus;
  listedAt: string | null;
  seller: { id: string; shopName: string | null } | null;
  shop: {
    id: string;
    shopName: string | null;
    logo: string | null;
    verificationStatus: string | null;
  } | null;
}

// GET /api/seller/notifications - newest first, max 50.
// `type` is open-ended ("listing_approved", ...) so it's typed as a string
// rather than a union we'd have to chase every time the backend adds one.
export interface SellerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  // The product id, for deep linking. Null for notifications not about a
  // specific listing.
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

// GET /api/buyer/shops/nearby - the proper nearby search: it honours
// radiusKm and returns a real distance, a place name and a product count.
export interface NearbyShop {
  id: string;
  shopName: string | null;
  logo: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  verificationStatus: string | null;
  distanceKm: number | null;
  productCount: number;
}

// GET /api/sellers/nearby. Coordinates arrive as strings ("5.6000000") and
// are normalised to numbers by the service.
export interface NearbySeller {
  id: string;
  userId: string;
  shopName: string | null;
  logoUrl: string | null;
  verificationStatus: string | null;
  latitude: number;
  longitude: number;
  // Computed on the client - the endpoint doesn't return one.
  distanceKm: number | null;
}

// GET /api/buyer/products?latitude&longitude&radiusKm
export interface NearbyProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  shopName: string | null;
  distanceKm: number | null;
}

export interface SellerDashboardData {
  name: string;
  avatar: string | null;
  shopName: string;
  totalListings: number;
  approved: number;
  pending: number;
  rejected: number;
  recentListings: DashboardListing[];
}

export interface SellerDashboard {
  businessName: string;
  verificationStatus: VerificationStatus;
  totalListings: number;
  activeListings: number;
  draftListings: number;
  soldOutListings: number;
  totalViews: number;
  recentListings: SellerListing[];
}
