import { NavigatorScreenParams, CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Route names/params for the seller side, kept apart from
// SellerNavigator.tsx so screens can import them without a cycle.
//
// SellerStack
// ├── SellerTabs (bottom tabs)
// │   ├── Home
// │   ├── Create   (no screen of its own - tapping it opens the listing form)
// │   ├── Shop     (stack: ListingsHome -> ListingForm)
// │   └── Profile
// ├── BusinessName (full screen, from the Profile's Business Information list)
// ├── ShopDetails  (full screen - shop name/photo/categories, from Profile)
// └── Verification (full screen, opened from Home banner / Profile)

export type ListingsStackParamList = {
  ListingsHome: undefined;
  ListingForm: { listingId?: string } | undefined;
};

export type SellerTabParamList = {
  Home: undefined;
  Create: undefined;
  Shop: NavigatorScreenParams<ListingsStackParamList> | undefined;
  Profile: undefined;
};

export type SellerStackParamList = {
  SellerTabs: NavigatorScreenParams<SellerTabParamList> | undefined;
  BusinessName: undefined;
  ShopDetails: undefined;
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
