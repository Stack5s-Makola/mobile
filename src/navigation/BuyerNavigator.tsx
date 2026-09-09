import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BuyerPlaceholderScreen } from "@screens/buyer/BuyerPlaceholderScreen";

// Built out when Buyer Home + nav tabs are implemented (Tue-Thu).
// Expected tabs (per architecture doc): Home, Map, Categories, Saved, Profile
// BuyerPlaceholderScreen below exists only so the auth flow is testable
// end-to-end today - swap it for the real Home tab, don't build on top of it.

const Tab = createBottomTabNavigator();

export function BuyerNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={BuyerPlaceholderScreen} />
    </Tab.Navigator>
  );
}
