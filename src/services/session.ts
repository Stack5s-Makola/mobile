import * as SecureStore from "expo-secure-store";
import { User } from "@types/user";

// Single source of truth for the persisted session. AuthContext owns
// writing it; services read it here to attach the bearer token (and the
// mocks use it to scope in-memory data per signed-in user).

export const SESSION_KEY = "makola_session";

export type Session = {
  accessToken: string;
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
