import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { User, UserRole } from "@types/user";
import { SESSION_KEY, Session } from "@services/session";

type AuthContextValue = {
  session: Session | null;
  isHydrating: boolean; // true while checking secure-store on launch
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  login: (accessToken: string, user: User) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // On app launch, check secure-store for a persisted session so users
  // aren't logged out every time they close the app.
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(SESSION_KEY);
        if (stored) {
          setSession(JSON.parse(stored) as Session);
          setIsOnboarded(true); // returning user, skip onboarding
        }
      } catch (err) {
        console.warn("Failed to hydrate session from SecureStore", err);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  async function login(accessToken: string, user: User) {
    const next: Session = { accessToken, user };
    setSession(next);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
  }

  async function setRole(role: UserRole) {
    if (!session) return;
    const next: Session = { ...session, user: { ...session.user, role } };
    setSession(next);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
  }

  async function logout() {
    setSession(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ session, isHydrating, isOnboarded, setIsOnboarded, login, setRole, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
