export type UserRole = "BUYER" | "SELLER";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
}
