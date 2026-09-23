import * as apiAuthService from "@services/api/authService";

// Single-swap-point wrapper, same pattern as listingService.ts /
// sellerService.ts. Register, OTP verify/resend, login and logout are live
// on the real backend.
//
// Not covered by any endpoint yet, so these stay on the mock and are
// imported directly where they're used (see src/screens/auth/README.md):
//   - role + profile setup (no fields for them on the backend user)
//   - forgot / reset password
export const authService = apiAuthService;
