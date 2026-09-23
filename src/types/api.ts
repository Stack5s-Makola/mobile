// Matches the backend's response convention documented in the
// architecture doc: { success, message, data }. Mocks (Step 3+)
// should return this exact shape so swapping in real endpoints is a
// drop-in change, not a rewrite.

export interface ApiFieldErrors {
  [field: string]: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  // Present on validation failures, e.g.
  //   { code: "code must be 6 digits" }
  // Optional because only some failures are field-level - the rest carry a
  // ready-to-show `message` instead.
  errors?: ApiFieldErrors;
}
