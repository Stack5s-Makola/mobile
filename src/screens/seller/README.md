# Seller Screens

Owned by Daniel's seller-experience minor track. Routed from
`src/navigation/SellerNavigator.tsx` (route types in `sellerRoutes.ts`).

| Tab       | Screen                      | What it does                                             |
| --------- | --------------------------- | -------------------------------------------------------- |
| Dashboard | `SellerDashboardScreen`     | Stats, verification banner, quick actions, recent listings |
| Shop      | `SellerShopScreen`          | Edit shop profile: photo, name, about, hours, categories, open/closed |
| Listings  | `SellerListingsScreen`      | All listings with status filters                         |
|           | `ListingFormScreen`         | Create / edit / delete a listing (nested stack)          |
| Profile   | `SellerProfileScreen`       | Account details, shortcuts, log out                      |
| (no tab)  | `SellerVerificationScreen`  | Submit ID + selfie, see review status. Full screen above the tabs, opened from the Dashboard banner or Profile menu |

## Backend integration

Every screen goes through `src/services/sellerService.ts`, which currently
points at `src/services/mocks/sellerService.ts`. To go live, change that
one import to `@services/api/sellerService` - the function names,
signatures and `ApiResponse<T>` shapes are identical.

Proposed endpoints (all behind the auth guard; the seller comes from the
bearer token, which `authedApiRequest` attaches):

| Method | Path                          | Service function      |
| ------ | ----------------------------- | --------------------- |
| GET    | `/api/seller/dashboard`       | `getDashboard`        |
| GET    | `/api/seller/shop`            | `getShop`             |
| PATCH  | `/api/seller/shop`            | `updateShop`          |
| GET    | `/api/seller/listings`        | `getMyListings`       |
| GET    | `/api/seller/listings/:id`    | `getMyListing`        |
| POST   | `/api/seller/listings`        | `createListing`       |
| PATCH  | `/api/seller/listings/:id`    | `updateListing`       |
| DELETE | `/api/seller/listings/:id`    | `deleteListing`       |
| GET    | `/api/seller/verification`    | `getVerification`     |
| POST   | `/api/seller/verification`    | `submitVerification`  |

Still open before switching to the real API:

- **Image uploads** - listing photos, shop photo and ID/selfie are local
  device URIs. Decide the upload endpoint/storage, upload first, then send
  the returned URLs.
- **Contract check** - types in `src/types/seller.ts` are the proposed
  DTOs; reconcile with the NestJS Seller module.
- **SOLD_OUT** is expected to be derived server-side from `stock`
  (the mock mirrors that rule in `resolveStatus`).
- **Verification review** happens in the Admin web app; the mock stays at
  PENDING after submission.

## Mock behaviour

Data is in memory, scoped per signed-in user, seeded with three sample
listings (active, sold out, draft) and reset when Metro restarts.
