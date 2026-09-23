import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Plus, Package } from "lucide-react-native";
import { Chip } from "@components/Chip";
import { PrimaryButton } from "@components/PrimaryButton";
import { SellerListingRow } from "@components/SellerListingRow";
import { colors, fonts, radii } from "@constants/theme";
import { TAB_BAR_CLEARANCE } from "@components/AppTabBar";
import { LISTING_STATUS_META } from "@constants/sellerStatus";
import { ListingsStackProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import { ListingStatus, SellerListing } from "@types/seller";

type Filter = "ALL" | ListingStatus;
const FILTERS: Filter[] = ["ALL", "ACTIVE", "DRAFT", "SOLD_OUT"];

export function SellerListingsScreen({ navigation }: ListingsStackProps<"ListingsHome">) {
  const [listings, setListings] = useState<SellerListing[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await sellerService.getMyListings();
      if (res.success) {
        setListings(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load your listings. Pull down to try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refetch on focus so returning from the create/edit form shows changes.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(
    () => (filter === "ALL" ? listings ?? [] : (listings ?? []).filter((l) => l.status === filter)),
    [listings, filter]
  );

  const countFor = (f: Filter) =>
    f === "ALL" ? listings?.length ?? 0 : listings?.filter((l) => l.status === f).length ?? 0;

  if (!listings && !error) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My listings</Text>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={() => navigation.navigate("ListingForm", {})}
          accessibilityRole="button"
          accessibilityLabel="Add listing"
        >
          <Plus size={18} color={colors.white} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={`${f === "ALL" ? "All" : LISTING_STATUS_META[f].label} (${countFor(f)})`}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <SellerListingRow
            listing={item}
            onPress={() => navigation.navigate("ListingForm", { listingId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          listings ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Package size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "ALL"
                  ? "No listings yet"
                  : `No ${LISTING_STATUS_META[filter].label.toLowerCase()} listings`}
              </Text>
              {filter === "ALL" ? (
                <>
                  <Text style={styles.emptyBody}>
                    Add your first product so buyers nearby can find you.
                  </Text>
                  <PrimaryButton
                    label="Add your first listing"
                    onPress={() => navigation.navigate("ListingForm", {})}
                    style={styles.emptyButton}
                  />
                </>
              ) : null}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addLabel: { color: colors.white, fontSize: 14, fontFamily: fonts.bodySemiBold },
  pressed: { opacity: 0.85 },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  error: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.danger,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 },
  separator: { height: 10 },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  emptyButton: { marginTop: 20 },
});
