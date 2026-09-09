# Auth Screens

Built in Step 3: Register, OTP Verify, Role Selection.

Each screen should call the mocked auth service in
`src/services/mocks/authService.ts` until Promise's User/Seller
endpoints are live, then swap to `src/services/api/authService.ts`
without changing screen code (both return `ApiResponse<T>`).
