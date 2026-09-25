import {
  NavigatorScreenParams,
  CompositeScreenProps,
} from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Route names/params for the buyer side, kept apart from
// BuyerNavigator.tsx so screens can import them without a cycle.
// Mirrors the pattern in src/navigation/sellerRoutes.ts.
//
// BuyerStack
// ├── BuyerTabs (bottom tabs - matches Figma's 4-tab BUYER NAV)
// │   ├── Home
// │   ├── Search
// │   ├── Saved
// │   └── Profile
// ├── Categories (full screen, opened from Home's "View All")
// └── ProductDetails (full screen, opened from any product card)
// └── Notifications (full screen, opened from Home or Profile)

export type BuyerTabParamList = {
  Home: undefined;
  Search: undefined;
  Saved: { section?: "products" | "shops" } | undefined;
  Profile: undefined;
};

export type BuyerStackParamList = {
  BuyerTabs: NavigatorScreenParams<BuyerTabParamList> | undefined;
  Categories: { categoryId?: string } | undefined;
  ProductDetails: { listingId: string };
  Notifications: undefined;
};

export type BuyerStackProps<T extends keyof BuyerStackParamList> =
  NativeStackScreenProps<BuyerStackParamList, T>;

export type BuyerTabProps<T extends keyof BuyerTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BuyerTabParamList, T>,
    NativeStackScreenProps<BuyerStackParamList>
  >;
