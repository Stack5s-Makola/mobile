// Matches the backend's response convention documented in the
// architecture doc: { success, message, data }. Mocks (Step 3+)
// should return this exact shape so swapping in real endpoints is a
// drop-in change, not a rewrite.

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
