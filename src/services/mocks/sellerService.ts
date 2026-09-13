import { ApiResponse } from "@types/api";
import {
  ListingPayload,
  SellerDashboard,
  SellerListing,
  Shop,
  SubmitVerificationPayload,
  UpdateShopPayload,
  Verification,
} from "@types/seller";
import { User } from "@types/user";
import { readStoredSession } from "@services/session";

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function fail<T>(message: string): Promise<ApiResponse<T>> {
  return delay({ success: false, message, data: null as never });
}

type SellerStore = {
  shop: Shop;
  listings: SellerListing[];
  verification: Verification;
};

// In-memory "database", one store per signed-in seller (keyed by the
// session's user id, the same way the backend scopes by bearer token).
// Resets every time Metro restarts.
const stores = new Map<string, SellerStore>();
let nextListingId = 1;

function seedStore(user: User | undefined): SellerStore {
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();
  // A few sample listings so Dashboard/Listings have something to show
  // on a fresh mock account - a real new seller starts with none.
  const sample = (
    name: string,
    price: number,
    category: string,
    stock: number,
    status: SellerListing["status"],
    image: string,
    views: number,
    daysAgo: number
  ): SellerListing => ({
    id: `seller-listing-${nextListingId++}`,
    name,
    description: "",
    price,
    category,
    stock,
    images: [image],
    status,
    views,
    createdAt: iso(daysAgo),
    updatedAt: iso(daysAgo),
  });

  return {
    shop: {
      id: `shop-${user?.id ?? "anonymous"}`,
      businessName: user?.businessName ?? "My Shop",
      description: "",
      location: user?.location ?? "",
      phone: user?.phone ?? "",
      photoUri: user?.photoUri,
      categories: [],
      openingHours: "Mon – Sat, 8:00am – 6:00pm",
      isOpen: true,
    },
    listings: [
      sample(
        "Fresh Tomatoes (basket)",
        45,
        "Farm Produce",
        20,
        "ACTIVE",
        "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
        128,
        1
      ),
      sample(
        "Plantain Chips (pack of 10)",
        60,
        "Farm Produce",
        0,
        "SOLD_OUT",
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
        74,
        3
      ),
      sample(
        "Handwoven Basket",
        80,
        "Artisan Goods",
        5,
        "DRAFT",
        "https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=400",
        0,
        5
      ),
    ],
    verification: { status: "NOT_STARTED" },
  };
}

async function getStore(): Promise<SellerStore> {
  const session = await readStoredSession();
  const key = session?.user.id ?? "anonymous";
  let store = stores.get(key);
  if (!store) {
    store = seedStore(session?.user);
    stores.set(key, store);
  }
  return store;
}

// Mirrors the backend rule: a published listing with no stock is
// SOLD_OUT, and restocking it makes it ACTIVE again. Drafts stay drafts.
function resolveStatus(payload: ListingPayload): SellerListing["status"] {
  if (payload.status === "DRAFT") return "DRAFT";
  return payload.stock > 0 ? "ACTIVE" : "SOLD_OUT";
}

const byUpdatedDesc = (a: SellerListing, b: SellerListing) =>
  b.updatedAt.localeCompare(a.updatedAt);

export async function getDashboard(): Promise<ApiResponse<SellerDashboard>> {
  const { shop, listings, verification } = await getStore();
  const count = (status: SellerListing["status"]) =>
    listings.filter((l) => l.status === status).length;
  return delay({
    success: true,
    message: "OK",
    data: {
      businessName: shop.businessName,
      verificationStatus: verification.status,
      totalListings: listings.length,
      activeListings: count("ACTIVE"),
      draftListings: count("DRAFT"),
      soldOutListings: count("SOLD_OUT"),
      totalViews: listings.reduce((sum, l) => sum + l.views, 0),
      recentListings: [...listings].sort(byUpdatedDesc).slice(0, 3),
    },
  });
}

export async function getShop(): Promise<ApiResponse<Shop>> {
  const { shop } = await getStore();
  return delay({ success: true, message: "OK", data: { ...shop } });
}

export async function updateShop(payload: UpdateShopPayload): Promise<ApiResponse<Shop>> {
  const store = await getStore();
  if (payload.businessName !== undefined && payload.businessName.trim() === "") {
    return fail("Business name can't be empty");
  }
  store.shop = { ...store.shop, ...payload };
  return delay({ success: true, message: "Shop updated", data: { ...store.shop } });
}

export async function getMyListings(): Promise<ApiResponse<SellerListing[]>> {
  const { listings } = await getStore();
  return delay({ success: true, message: "OK", data: [...listings].sort(byUpdatedDesc) });
}

export async function getMyListing(listingId: string): Promise<ApiResponse<SellerListing>> {
  const { listings } = await getStore();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return fail("Listing not found");
  return delay({ success: true, message: "OK", data: { ...listing } });
}

export async function createListing(payload: ListingPayload): Promise<ApiResponse<SellerListing>> {
  const store = await getStore();
  const now = new Date().toISOString();
  const listing: SellerListing = {
    ...payload,
    id: `seller-listing-${nextListingId++}`,
    status: resolveStatus(payload),
    views: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.listings.push(listing);
  return delay({
    success: true,
    message: listing.status === "DRAFT" ? "Draft saved" : "Listing published",
    data: { ...listing },
  });
}

export async function updateListing(
  listingId: string,
  payload: ListingPayload
): Promise<ApiResponse<SellerListing>> {
  const store = await getStore();
  const index = store.listings.findIndex((l) => l.id === listingId);
  if (index === -1) return fail("Listing not found");
  const updated: SellerListing = {
    ...store.listings[index],
    ...payload,
    status: resolveStatus(payload),
    updatedAt: new Date().toISOString(),
  };
  store.listings[index] = updated;
  return delay({ success: true, message: "Listing updated", data: { ...updated } });
}

export async function deleteListing(listingId: string): Promise<ApiResponse<{ id: string }>> {
  const store = await getStore();
  const before = store.listings.length;
  store.listings = store.listings.filter((l) => l.id !== listingId);
  if (store.listings.length === before) return fail("Listing not found");
  return delay({ success: true, message: "Listing deleted", data: { id: listingId } });
}

export async function getVerification(): Promise<ApiResponse<Verification>> {
  const { verification } = await getStore();
  return delay({ success: true, message: "OK", data: { ...verification } });
}

// Moves the seller to PENDING. Approval/rejection happens from the Admin
// web app, so the mock never advances past PENDING on its own.
export async function submitVerification(
  payload: SubmitVerificationPayload
): Promise<ApiResponse<Verification>> {
  const store = await getStore();
  if (store.verification.status === "PENDING" || store.verification.status === "VERIFIED") {
    return fail("Verification has already been submitted");
  }
  store.verification = {
    ...payload,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
  };
  return delay({
    success: true,
    message: "Submitted for review",
    data: { ...store.verification },
  });
}
