import { NavigatorScreenParams, CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Route names/params for the seller side, kept apart from
// SellerNavigator.tsx so screens can import them without a cycle.
//
// SellerStack
// ├── SellerTabs (bottom tabs)
// │   ├── Dashboard
// │   ├── Shop
// │   ├── Listings (stack: ListingsHome -> ListingForm)
// │   └── Profile
// └── Verification (full screen, opened from Dashboard banner / Profile)

export type ListingsStackParamList = {
  ListingsHome: undefined;
  ListingForm: { listingId?: string } | undefined;
};

export type SellerTabParamList = {
  Dashboard: undefined;
  Shop: undefined;
  Listings: NavigatorScreenParams<ListingsStackParamList> | undefined;
  Profile: undefined;
};

export type SellerStackParamList = {
  SellerTabs: NavigatorScreenParams<SellerTabParamList> | undefined;
  Verification: undefined;
};

export type SellerStackProps<T extends keyof SellerStackParamList> = NativeStackScreenProps<
  SellerStackParamList,
  T
>;

export type SellerTabProps<T extends keyof SellerTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<SellerTabParamList, T>,
  NativeStackScreenProps<SellerStackParamList>
>;

export type ListingsStackProps<T extends keyof ListingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ListingsStackParamList, T>,
  SellerTabProps<keyof SellerTabParamList>
>;
