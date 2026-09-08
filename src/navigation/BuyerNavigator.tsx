import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Placeholder. Built out when Buyer Home + nav tabs are implemented.
// Expected tabs (per architecture doc): Home, Map, Categories, Saved, Profile

const Tab = createBottomTabNavigator();

export function BuyerNavigator() {
  return <Tab.Navigator screenOptions={{ headerShown: false }} />;
}
