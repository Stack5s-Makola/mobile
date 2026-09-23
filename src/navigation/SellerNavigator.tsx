import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import { Home, Plus, Package, User } from "lucide-react-native";
import { AppTabBar } from "@components/AppTabBar";
import {
  ListingsStackParamList,
  SellerStackParamList,
  SellerTabParamList,
} from "@navigation/sellerRoutes";
import { SellerDashboardScreen } from "@screens/seller/SellerDashboardScreen";
import { SellerShopScreen } from "@screens/seller/SellerShopScreen";
import { SellerListingsScreen } from "@screens/seller/SellerListingsScreen";
import { ListingFormScreen } from "@screens/seller/ListingFormScreen";
import { SellerVerificationScreen } from "@screens/seller/SellerVerificationScreen";
import { SellerProfileScreen } from "@screens/seller/SellerProfileScreen";
import { BusinessNameScreen } from "@screens/seller/BusinessNameScreen";
import { PhoneNumberScreen } from "@screens/seller/PhoneNumberScreen";
import { AddProductScreen } from "@screens/seller/AddProductScreen";
import { ProductPreviewScreen } from "@screens/seller/ProductPreviewScreen";

// Seller side of the role-based nav skeleton. Tabs: Home, Create, Shop,
// Profile.
//
// "Create" is an action dressed as a tab: it has no screen of its own, it
// intercepts the press and pushes AddProduct ABOVE the tabs, so the form
// isn't sitting under the floating tab bar.
//
// Shop has depth (list -> create/edit form), so it gets a nested stack.
// ShopDetails and Verification are full screens above the tabs, reached
// from Profile (and the Home banner) - one-off tasks, not daily
// destinations.

const Stack = createNativeStackNavigator<SellerStackParamList>();
const Tab = createBottomTabNavigator<SellerTabParamList>();
const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();

function ListingsNavigator() {
  return (
    <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
      <ListingsStack.Screen name="ListingsHome" component={SellerListingsScreen} />
      <ListingsStack.Screen name="ListingForm" component={ListingFormScreen} />
    </ListingsStack.Navigator>
  );
}

// Never actually rendered: the Create tab always prevents its own press.
function CreatePlaceholder() {
  return <View />;
}

const TAB_ICONS: Record<keyof SellerTabParamList, typeof Home> = {
  Home,
  Create: Plus,
  Listing: Package,
  Profile: User,
};

function SellerTabs() {
  return (
    <Tab.Navigator
      // "history" so back returns to the previously visited tab rather than
      // always jumping to the first one - the Profile screen's back arrow
      // relies on this.
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} icons={TAB_ICONS} />}
    >
      <Tab.Screen name="Home" component={SellerDashboardScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("AddProduct");
          },
        })}
      />
      <Tab.Screen name="Listing" component={ListingsNavigator} />
      <Tab.Screen name="Profile" component={SellerProfileScreen} />
    </Tab.Navigator>
  );
}

export function SellerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerTabs" component={SellerTabs} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ProductPreview" component={ProductPreviewScreen} />
      <Stack.Screen name="BusinessName" component={BusinessNameScreen} />
      <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
      <Stack.Screen name="ShopDetails" component={SellerShopScreen} />
      <Stack.Screen name="Verification" component={SellerVerificationScreen} />
    </Stack.Navigator>
  );
}
