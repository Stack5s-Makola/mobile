export type UserRole = "BUYER" | "SELLER";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  location: string;
  // True once the emailed OTP has been confirmed. Optional because sessions
  // created before this existed won't have it.
  emailVerified?: boolean;
  // Seller-only, set during SellerProfileSetup
  businessName?: string;
  photoUri?: string;
}
