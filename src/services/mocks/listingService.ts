import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Sample data standing in for the initial 2km geo-fetch described in the
// architecture doc. Swap src/services/api/listingService.ts in once
// Promise's listings endpoint is live - same function signature.
const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    name: "Fresh Tomatoes (basket)",
    price: 45,
    mainImage: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
    sellerName: "Ama's Farm Produce",
    category: "Farm Produce",
  },
  {
    id: "2",
    name: "Kente Cloth (6 yards)",
    price: 350,
    mainImage: "https://images.unsplash.com/photo-1621941553782-e6b1e2c5c8d3?w=400",
    sellerName: "Osei Fabrics",
    category: "Fabric & Textiles",
  },
  {
    id: "3",
    name: "Handwoven Basket",
    price: 80,
    mainImage: "https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=400",
    sellerName: "Bolga Crafts",
    category: "Artisan Goods",
  },
  {
    id: "4",
    name: "Refurbished Smartphone",
    price: 900,
    mainImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    sellerName: "Kwame Electronics",
    category: "Electronics",
  },
  {
    id: "5",
    name: "Plantain Chips (pack of 10)",
    price: 60,
    mainImage: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
    sellerName: "Adjoa Snacks",
    category: "Farm Produce",
  },
  {
    id: "6",
    name: "Beaded Necklace Set",
    price: 120,
    mainImage: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400",
    sellerName: "Efua Beads",
    category: "Artisan Goods",
  },
];

export async function getListings(): Promise<ApiResponse<Listing[]>> {
  return delay({
    success: true,
    message: "OK",
    data: MOCK_LISTINGS,
  });
}
