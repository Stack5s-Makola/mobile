export type UserRole = "BUYER" | "SELLER";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  location: string;
  // Seller-only, set during SellerProfileSetup
  businessName?: string;
  photoUri?: string;
}
