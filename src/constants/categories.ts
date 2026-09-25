export interface Category {
  id: string;
  label: string;
  icon: string; // emoji - simple, no extra asset/icon-library dependency
}

// Canonical category list. Figma's Home chip row and Categories screen use
// slightly different naming/sets (e.g. Home shows "Fabrics", the Categories
// screen shows "Electronics" instead) - this merges both against the seller
// types named in the business overview doc. Worth flagging to Charity to
// reconcile in the source designs.
export const CATEGORIES: Category[] = [
  { id: "fabrics", label: "Fabrics", icon: "🧵" },
  { id: "handicraft", label: "Handicraft", icon: "🪵" },
  { id: "beauty", label: "Beauty", icon: "💄" },
  { id: "farm-produce", label: "Farm Produce", icon: "🥭" },
  { id: "electronics", label: "Electronics", icon: "📱" },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
