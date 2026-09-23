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
