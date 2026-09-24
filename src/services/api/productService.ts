import { ApiResponse } from "@types/api";
import { ProductDetails } from "@types/seller";
import { authedApiRequest } from "./client";

// GET /api/buyer/products/:id - the buyer-facing view of a single product.
// Requires a token; a seller's works, and returns their own pending products
// too, so the seller side reuses it rather than needing its own endpoint.
export function getProductDetails(id: string): Promise<ApiResponse<ProductDetails>> {
  return authedApiRequest(`/api/buyer/products/${id}`);
}
