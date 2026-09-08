import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "@types/user";

type User = {
  id: string;
  fullName: string;
  role: UserRole;
} | null;

type AuthContextValue = {
  user: User;
  isOnboarded: boolean;
  setUser: (user: User) => void;
  setIsOnboarded: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO (Step 3): back this with expo-secure-store so sessions persist
  // across app restarts, and hydrate from stored refresh token on launch.
  const [user, setUser] = useState<User>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  return (
    <AuthContext.Provider value={{ user, isOnboarded, setUser, setIsOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
