import * as SecureStore from "expo-secure-store";
import { User } from "@types/user";

// Single source of truth for the persisted session. AuthContext owns
// writing it; services read it here to attach the bearer token (and the
// mocks use it to scope in-memory data per signed-in user).
//
// expo-secure-store is Keychain on iOS and EncryptedSharedPreferences on
// Android, so tokens sit in OS-backed secure storage rather than plain
// AsyncStorage. It survives app restarts, which is what keeps a verified
// seller signed in instead of making them log in again on every launch.

export const SESSION_KEY = "makola_session";

export type Session = {
  accessToken: string;
  // Only present once the backend starts issuing one.
  refreshToken?: string;
  user: User;
};

export async function readStoredSession(): Promise<Session | null> {
  try {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    return stored ? (JSON.parse(stored) as Session) : null;
  } catch {
    return null;
  }
}

export async function writeStoredSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
