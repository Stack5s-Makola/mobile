import {
  Apple,
  Brush,
  Cpu,
  Gem,
  Shirt,
  type LucideIcon,
} from "lucide-react-native";

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Canonical category list. Figma's Home chip row and Categories screen use
// slightly different naming/sets (e.g. Home shows "Fabrics", the Categories
// screen shows "Electronics" instead) - this merges both against the seller
// types named in the business overview doc. Worth flagging to Charity to
// reconcile in the source designs.
export const CATEGORIES: Category[] = [
  { id: "fabrics", label: "Fabrics", icon: Shirt },
  { id: "handicraft", label: "Handicraft", icon: Gem },
  { id: "beauty", label: "Beauty", icon: Brush },
  { id: "farm-produce", label: "Farm Produce", icon: Apple },
  { id: "electronics", label: "Electronics", icon: Cpu },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
