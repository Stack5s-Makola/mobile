import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@types/user";

// The backend user record has no full name, location, business name or
// photo, and no endpoint to set them - profile setup writes them here
// instead, keyed by the backend user id.
//
// Without this, signing out and back in would blank the name on every
// profile screen, because nothing on the server remembers it. Delete this
// file once those fields exist on the API and fold them into AuthContext.
//
// Plain AsyncStorage on purpose: these are display fields, not credentials.

type StoredProfile = Pick<User, "fullName" | "location" | "businessName" | "photoUri">;

const KEY_PREFIX = "makola_profile:";

export async function readProfile(userId: string): Promise<Partial<StoredProfile>> {
  try {
    const stored = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    return stored ? (JSON.parse(stored) as StoredProfile) : {};
  } catch {
    return {};
  }
}

export async function writeProfile(
  userId: string,
  profile: Partial<StoredProfile>
): Promise<void> {
  try {
    const merged = { ...(await readProfile(userId)), ...profile };
    await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(merged));
  } catch (err) {
    console.warn("Failed to cache profile fields", err);
  }
}
