import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getCategoryLabel } from "@constants/categories";
import { useToast } from "@components/Toast";
import * as apiSellerService from "@services/api/sellerService";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { SellerStackProps } from "@navigation/sellerRoutes";
import { initials, normalizeAmount } from "@utils/format";

// Last step before a product is submitted - shows the seller roughly what a
// buyer will see. Everything comes through nav params from AddProductScreen;
// nothing is persisted until "Submit For Approval" is wired up.
// Same green as the seller profile page.
const GREEN = "#1CA30A";
const VERIFIED = "#F5821F";

export function ProductPreviewScreen({ navigation, route }: SellerStackProps<"ProductPreview">) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const user = session?.user;
  const { imageUri, name, category, tags, price, quantity, description, location } =
    route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await apiSellerService.addProduct({
        name,
        // The endpoint wants a category NAME, not the id the form holds.
        category: category ? getCategoryLabel(category) : "",
        price,
        quantity,
        tags,
        imageUri,
      });
      if (res.success) {
        showToast(res.message, "success");
        // Back to the tabs - the dashboard refetches on focus, so the new
        // product appears in Recent Listing.
        navigation.popToTop();
      } else {
        const fieldError = res.errors ? Object.values(res.errors)[0] : undefined;
        showToast(fieldError ?? res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const amount = Number(normalizeAmount(price));
  const shopLocation = location || user?.location;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Product Preview</Text>
        {/* Balances the arrow so the title stays optically centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : null}
        </View>

        <View style={styles.headline}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.price}>
            GHS {Number.isFinite(amount) ? amount.toFixed(2) : price}
          </Text>
        </View>

        {description ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Description</Text>
            <Text style={styles.blockBody}>{description}</Text>
          </View>
        ) : null}

        {category ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Categories</Text>
            <Text style={styles.blockBody}>{getCategoryLabel(category)}</Text>
          </View>
        ) : null}

        <View style={styles.seller}>
          <View style={styles.avatarBox}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials(user?.businessName)}</Text>
              </View>
            )}
            {user?.emailVerified ? (
              <MaterialIcons
                name="verified"
                size={18}
                color={VERIFIED}
                style={styles.verifiedBadge}
                accessibilityLabel="Verified"
              />
            ) : null}
          </View>
          <View style={styles.sellerText}>
            <Text style={styles.shopName} numberOfLines={1}>
              {user?.businessName}
            </Text>
            {shopLocation ? (
              <View style={styles.locationRow}>
                <MapPin size={18} color={colors.textMuted} />
                <Text style={styles.location} numberOfLines={1}>
                  {shopLocation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitLabel}>Submit For Approval</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.headlineBold, color: GREEN },
  headerSpacer: { width: 26 },
  content: { padding: 20, paddingBottom: 24, gap: 20 },

  imageCard: {
    height: 300,
    borderRadius: 18,
    backgroundColor: "#EAF1EE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  headline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 22, fontFamily: fonts.headline, color: GREEN },
  price: { fontSize: 26, fontFamily: fonts.headlineBold, color: GREEN },

  block: { gap: 6 },
  blockLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: GREEN },
  blockBody: { fontSize: 15, fontFamily: fonts.bodyRegular, color: colors.textMuted, lineHeight: 22 },

  seller: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: { width: 54, height: 54 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 18, fontFamily: fonts.headline, color: GREEN },
  verifiedBadge: { position: "absolute", right: -2, bottom: -2 },
  sellerText: { flex: 1, gap: 2 },
  shopName: { fontSize: 17, fontFamily: fonts.bodySemiBold, color: GREEN },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 16, fontFamily: fonts.bodyRegular, color: colors.textMuted },

  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  cancel: {
    flex: 1,
    height: 58,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF2F0",
  },
  cancelLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: GREEN },
  submit: {
    flex: 1.6,
    height: 58,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
  },
  submitLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.white },
  pressed: { opacity: 0.85 },
});
