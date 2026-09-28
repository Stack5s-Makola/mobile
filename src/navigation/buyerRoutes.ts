import {
  NavigatorScreenParams,
  CompositeScreenProps,
} from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NearbyProduct, NearbyShop } from "@types/seller";

// Route names/params for the buyer side, kept apart from
// BuyerNavigator.tsx so screens can import them without a cycle.
// Mirrors the pattern in src/navigation/sellerRoutes.ts.
//
// BuyerStack
// ├── BuyerTabs (bottom tabs - matches Figma's 4-tab BUYER NAV)
// │   ├── Home
// │   ├── Search
// │   ├── Saved (shops)
// │   └── Profile
// ├── Categories (full screen, opened from Home's "View All")
// └── ProductDetails (full screen, opened from any product card)
// └── Notifications (full screen, opened from Home or Profile)
// └── BuyerMap (full screen, from the Home map button)
// └── ShopProfile (full screen, from the map sheet's "View Shop")
// └── BuyerName / BuyerPhone / BuyerPassword (full screens, from Profile)

export type BuyerTabParamList = {
  Home: undefined;
  Search: undefined;
  // Saved holds shops only, so there is no section to choose.
  Saved: undefined;
  Profile: undefined;
};

export type BuyerStackParamList = {
  BuyerTabs: NavigatorScreenParams<BuyerTabParamList> | undefined;
  Categories: { categoryId?: string } | undefined;
  ProductDetails: { listingId: string };
  Notifications: undefined;
  BuyerMap: undefined;
  // Carried from the map rather than refetched: there's no public
  // "get one shop" endpoint, and this way the page works offline too.
  ShopProfile: {
    shop: NearbyShop;
    products: NearbyProduct[];
    // Buyers can open a product; sellers have no such route.
    openProducts?: boolean;
  };
  BuyerName: undefined;
  BuyerPhone: undefined;
  BuyerPassword: undefined;
};

export type BuyerStackProps<T extends keyof BuyerStackParamList> =
  NativeStackScreenProps<BuyerStackParamList, T>;

export type BuyerTabProps<T extends keyof BuyerTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BuyerTabParamList, T>,
    NativeStackScreenProps<BuyerStackParamList>
  >;
