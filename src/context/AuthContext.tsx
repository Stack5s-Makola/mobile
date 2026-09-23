import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@types/user";
import {
  Session,
  readStoredSession,
  writeStoredSession,
  clearStoredSession,
} from "@services/session";

type AuthContextValue = {
  session: Session | null;
  isHydrating: boolean; // true while checking secure-store on launch
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  login: (accessToken: string, user: User, refreshToken?: string) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  // Patch fields on the signed-in user and persist them. Local only - there
  // is no endpoint yet to push profile changes back to the server.
  updateUser: (patch: Partial<User>) => Promise<void>;
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
        const stored = await readStoredSession();
        if (stored) {
          setSession(stored);
          setIsOnboarded(true); // returning user, skip onboarding
        }
      } catch (err) {
        console.warn("Failed to hydrate session from SecureStore", err);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  async function login(accessToken: string, user: User, refreshToken?: string) {
    const next: Session = { accessToken, refreshToken, user };
    setSession(next);
    // Persisted here, so closing the app doesn't sign them out.
    await writeStoredSession(next);
  }

  async function updateUser(patch: Partial<User>) {
    // Re-read rather than trusting state, so a token rotated mid-edit isn't
    // overwritten with a stale one.
    const current = (await readStoredSession()) ?? session;
    if (!current) return;
    const next: Session = { ...current, user: { ...current.user, ...patch } };
    setSession(next);
    await writeStoredSession(next);
  }

  async function setRole(role: UserRole) {
    if (!session) return;
    const next: Session = { ...session, user: { ...session.user, role } };
    setSession(next);
    await writeStoredSession(next);
  }

  async function logout() {
    setSession(null);
    await clearStoredSession();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isHydrating,
        isOnboarded,
        setIsOnboarded,
        login,
        setRole,
        updateUser,
        logout,
      }}
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
