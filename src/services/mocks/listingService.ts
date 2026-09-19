import { ApiResponse } from "@types/api";
import { Listing } from "@types/listing";

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Sample data standing in for the initial 2km geo-fetch described in the
// architecture doc. Category ids match src/constants/categories.ts.
const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    name: "Fruits And Vegetables",
    price: 200,
    mainImage: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
    sellerName: "Ama's Fruits And Veges",
    sellerPhone: "0243789019",
    sellerVerified: true,
    category: "farm-produce",
    location: "Madina",
    description: "Fresh fruits and vegetables, carefully selected for quality and freshness, GH₵200 per basket.",
  },
  {
    id: "2",
    name: "Fabric",
    price: 200,
    mainImage: "https://images.unsplash.com/photo-1621941553782-e6b1e2c5c8d3?w=400",
    sellerName: "Osei Fabrics",
    sellerPhone: "0201234567",
    sellerVerified: true,
    category: "fabrics",
    location: "Madina",
    description: "Premium quality fabric, sold by the yard. Wide range of colors and patterns available.",
  },
  {
    id: "3",
    name: "Handwoven Basket",
    price: 80,
    mainImage: "https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=400",
    sellerName: "Bolga Crafts",
    sellerPhone: "0244567890",
    sellerVerified: false,
    category: "handicraft",
    location: "Bolgatanga",
    description: "Handwoven basket made from local materials by skilled artisans.",
  },
  {
    id: "4",
    name: "Refurbished Smartphone",
    price: 900,
    mainImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    sellerName: "Kwame Electronics",
    sellerPhone: "0257890123",
    sellerVerified: true,
    category: "electronics",
    location: "Accra",
    description: "Fully tested refurbished smartphone with 6-month warranty.",
  },
  {
    id: "5",
    name: "Shea Butter Cream",
    price: 45,
    mainImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    sellerName: "Adjoa Naturals",
    sellerPhone: "0209876543",
    sellerVerified: false,
    category: "beauty",
    location: "Tamale",
    description: "100% organic shea butter cream, handmade in small batches.",
  },
  {
    id: "6",
    name: "Beaded Necklace Set",
    price: 120,
    mainImage: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400",
    sellerName: "Efua Beads",
    sellerPhone: "0271122334",
    sellerVerified: true,
    category: "handicraft",
    location: "Kumasi",
    description: "Handcrafted beaded necklace set, made with locally sourced beads.",
  },
];

export async function getListings(): Promise<ApiResponse<Listing[]>> {
  return delay({ success: true, message: "OK", data: MOCK_LISTINGS });
}

export async function getListingById(id: string): Promise<ApiResponse<Listing | null>> {
  return delay({
    success: true,
    message: "OK",
    data: MOCK_LISTINGS.find((l) => l.id === id) ?? null,
  });
}

export async function getListingsByCategory(categoryId: string): Promise<ApiResponse<Listing[]>> {
  return delay({
    success: true,
    message: "OK",
    data: MOCK_LISTINGS.filter((l) => l.category === categoryId),
  });
}
