# Mock Services

Built out in Step 3. Each mock service (authService, listingService,
etc.) returns `ApiResponse<T>` - the same shape the real `src/services/api`
equivalents will return - so screens never need to change when a real
endpoint goes live, only the import does.
