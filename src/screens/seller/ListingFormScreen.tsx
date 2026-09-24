import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ImagePlus, X } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { Chip } from "@components/Chip";
import { PrimaryButton } from "@components/PrimaryButton";
import { StatusBadge } from "@components/StatusBadge";
import { CATEGORIES } from "@constants/categories";
import { LISTING_STATUS_META } from "@constants/sellerStatus";
import { colors, fonts, radii } from "@constants/theme";
import { TAB_BAR_CLEARANCE } from "@components/AppTabBar";
import { useToast } from "@components/Toast";
import { ListingsStackProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import { ListingPayload, SellerListing } from "@types/seller";
import { pickImage } from "@utils/pickImage";

const MAX_IMAGES = 5;

// Create and edit share this screen: route.params.listingId present = edit.
export function ListingFormScreen({ navigation, route }: ListingsStackProps<"ListingForm">) {
  const listingId = route.params?.listingId;
  const isEdit = Boolean(listingId);

  const { showToast } = useToast();
  const [existing, setExisting] = useState<SellerListing | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEdit);
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [category, setCategory] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await sellerService.getMyListing(listingId);
        if (cancelled) return;
        if (res.success) {
          const l = res.data;
          setExisting(l);
          setImages(l.images);
          setName(l.name);
          setDescription(l.description);
          setPrice(String(l.price));
          setStock(String(l.stock));
          setCategory(l.category);
          setIsPublished(l.status !== "DRAFT");
        } else {
          showToast(res.message, "error");
          navigation.goBack();
        }
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, navigation]);

  const parsedPrice = Number(price.replace(",", "."));
  const parsedStock = Number(stock);

  // Drafts can be saved incomplete-ish (no photo yet); publishing needs
  // everything a buyer would see.
  const problems: string[] = [];
  if (name.trim().length === 0) problems.push("a name");
  if (!(parsedPrice > 0)) problems.push("a price");
  if (!Number.isInteger(parsedStock) || parsedStock < 0 || stock.trim() === "")
    problems.push("a stock quantity");
  if (!category) problems.push("a category");
  if (isPublished && images.length === 0) problems.push("at least one photo");
  const canSave = problems.length === 0;

  async function handleAddImage() {
    const uri = await pickImage({ aspect: [1, 1], askSource: true });
    if (uri) setImages((prev) => [...prev, uri].slice(0, MAX_IMAGES));
  }

  // By index, not URI - the same photo can be picked twice.
  function handleRemoveImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!canSave || !category) return;
    const payload: ListingPayload = {
      name: name.trim(),
      description: description.trim(),
      price: Math.round(parsedPrice * 100) / 100,
      category,
      stock: parsedStock,
      images,
      status: isPublished ? "ACTIVE" : "DRAFT",
    };
    setIsSaving(true);
    try {
      const res = listingId
        ? await sellerService.updateListing(listingId, payload)
        : await sellerService.createListing(payload);
      if (res.success) {
        navigation.goBack();
      } else {
        showToast(res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    if (!listingId) return;
    Alert.alert("Delete listing?", "Buyers will no longer see this product.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const res = await sellerService.deleteListing(listingId);
            if (res.success) {
              navigation.goBack();
            } else {
              showToast(res.message, "error");
            }
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }

  if (isLoadingExisting) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const statusMeta = existing ? LISTING_STATUS_META[existing.status] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>{isEdit ? "Edit listing" : "New listing"}</Text>
        <View style={styles.topSpacer}>
          {statusMeta ? <StatusBadge label={statusMeta.label} tone={statusMeta.tone} /> : null}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInset={{ bottom: KEYBOARD_GAP }}
      >
        <View>
          <Text style={styles.label}>Photos</Text>
          <Text style={styles.hint}>
            Up to {MAX_IMAGES}. The first photo is the one buyers see first.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.images}
          >
            {images.map((uri, index) => (
              <View key={`${index}-${uri}`} style={styles.imageTile}>
                <Image source={{ uri }} style={styles.image} />
                {index === 0 ? (
                  <View style={styles.mainTag}>
                    <Text style={styles.mainTagLabel}>Main</Text>
                  </View>
                ) : null}
                <Pressable
                  style={styles.removeImage}
                  onPress={() => handleRemoveImage(index)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <X size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <Pressable
                style={[styles.imageTile, styles.addImage]}
                onPress={handleAddImage}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
              >
                <ImagePlus size={24} color={colors.primary} />
                <Text style={styles.addImageLabel}>Add photo</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        <AppTextInput
          label="Product name"
          placeholder="e.g. Fresh tomatoes (basket)"
          value={name}
          onChangeText={setName}
          maxLength={80}
        />

        <AppTextInput
          label="Description"
          placeholder="Size, condition, what's included..."
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
          style={styles.multiline}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <AppTextInput
              label="Price (GH₵)"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex}>
            <AppTextInput
              label="In stock"
              placeholder="0"
              value={stock}
              onChangeText={(t) => setStock(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        <View style={styles.publishRow}>
          <View style={styles.flex}>
            <Text style={styles.publishTitle}>Visible to buyers</Text>
            <Text style={styles.hint}>
              {isPublished
                ? parsedStock === 0
                  ? "Published, but shown as sold out until you add stock."
                  : "Buyers nearby can find and view this listing."
                : "Saved as a draft - only you can see it."}
            </Text>
          </View>
          <Switch
            value={isPublished}
            onValueChange={setIsPublished}
            trackColor={{ true: colors.primary, false: colors.divider }}
            thumbColor={colors.white}
          />
        </View>

        {!canSave ? (
          <Text style={styles.problems}>Add {problems.join(", ")} to save.</Text>
        ) : null}

        <PrimaryButton
          label={isEdit ? "Save changes" : isPublished ? "Publish listing" : "Save draft"}
          onPress={handleSave}
          disabled={!canSave || isDeleting}
          loading={isSaving}
        />

        {isEdit ? (
          <Pressable
            onPress={handleDelete}
            disabled={isSaving || isDeleting}
            style={styles.deleteButton}
            accessibilityRole="button"
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.deleteLabel}>Delete listing</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE = 96;

// Breathing room between the focused field and the keyboard.
const KEYBOARD_GAP = 40;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topTitle: { fontSize: 18, fontFamily: fonts.headline, color: colors.primary },
  topSpacer: { width: 70, alignItems: "flex-end" },
  content: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE, gap: 20 },
  label: { fontSize: 16, fontFamily: fonts.headline, color: colors.text, marginBottom: 4 },
  hint: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  images: { gap: 10, paddingTop: 10 },
  imageTile: { width: TILE, height: TILE, borderRadius: radii.card, overflow: "hidden" },
  image: { width: "100%", height: "100%", backgroundColor: colors.neutralSoft },
  mainTag: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainTagLabel: { color: colors.white, fontSize: 10, fontFamily: fonts.bodySemiBold },
  removeImage: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImage: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageLabel: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.primary },
  multiline: { height: 110, paddingTop: 12, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  publishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
  },
  publishTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  problems: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  deleteButton: { alignItems: "center", paddingVertical: 12 },
  deleteLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.danger },
});
