import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ProductCard } from "@components/ProductCard";
import { Listing } from "@types/listing";
import * as mockListingService from "@services/mocks/listingService";

// Swap the import above for @services/api/listingService once Promise's
// listings endpoint is live - same function name/signature, no other changes.
const listingService = mockListingService;

export function BuyerHomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadListings = useCallback(async (isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const res = await listingService.getListings();
      if (res.success) {
        setListings(res.data);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>Discover near you</Text>
            <Text style={styles.subtitle}>{listings.length} sellers listing today</Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard listing={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadListings(true)} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 6 },
  header: { paddingHorizontal: 8, paddingVertical: 12 },
  greeting: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#777", marginTop: 2 },
});
