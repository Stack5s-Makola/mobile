import React, { useCallback, useEffect, useRef, useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Camera, Store } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { Chip } from "@components/Chip";
import { PrimaryButton } from "@components/PrimaryButton";
import { CATEGORIES } from "@constants/categories";
import { colors, fonts, radii } from "@constants/theme";
import { SellerTabProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import { Shop, UpdateShopPayload } from "@types/seller";
import { pickImage } from "@utils/pickImage";

type Form = Omit<Shop, "id">;

function toForm(shop: Shop): Form {
  const { id: _id, ...rest } = shop;
  return rest;
}

export function SellerShopScreen(_props: SellerTabProps<"Shop">) {
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = form !== null && JSON.stringify(form) !== JSON.stringify(saved);
  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Load on focus, but never clobber unsaved edits the seller is making.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await sellerService.getShop();
          if (cancelled) return;
          if (res.success) {
            const next = toForm(res.data);
            setSaved(next);
            if (!isDirtyRef.current) setForm(next);
            setError(null);
          } else {
            setError(res.message);
          }
        } catch {
          if (!cancelled) setError("Couldn't load your shop.");
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!form) {
    return (
      <SafeAreaView style={styles.loading}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const canSave = isDirty && form.businessName.trim().length > 0;

  function toggleCategory(category: string) {
    if (!form) return;
    update(
      "categories",
      form.categories.includes(category)
        ? form.categories.filter((c) => c !== category)
        : [...form.categories, category]
    );
  }

  async function handlePickPhoto() {
    const uri = await pickImage({ aspect: [1, 1], askSource: true });
    if (uri) update("photoUri", uri);
  }

  async function handleSave() {
    if (!form) return;
    const payload: UpdateShopPayload = {
      ...form,
      businessName: form.businessName.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      phone: form.phone.trim(),
      openingHours: form.openingHours.trim(),
    };
    setIsSaving(true);
    try {
      const res = await sellerService.updateShop(payload);
      if (res.success) {
        const next = toForm(res.data);
        setSaved(next);
        setForm(next);
        Alert.alert("Shop updated", "Buyers will see your changes right away.");
      } else {
        Alert.alert("Couldn't update shop", res.message);
      }
    } catch {
      Alert.alert("Couldn't update shop", "Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>My shop</Text>
          <Text style={styles.subtitle}>This is how buyers see your business.</Text>

          <View style={styles.photoSection}>
            <Pressable
              style={styles.photoCircle}
              onPress={handlePickPhoto}
              accessibilityRole="button"
              accessibilityLabel="Change shop photo"
            >
              {form.photoUri ? (
                <Image source={{ uri: form.photoUri }} style={styles.photoImage} />
              ) : (
                <Store size={40} color={colors.primary} />
              )}
            </Pressable>
            <Pressable style={styles.uploadBadge} onPress={handlePickPhoto}>
              <Camera size={14} color={colors.white} />
              <Text style={styles.uploadLabel}>
                {form.photoUri ? "Change photo" : "Add shop photo"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.openRow}>
            <View style={styles.flex}>
              <Text style={styles.openTitle}>
                {form.isOpen ? "Open for business" : "Temporarily closed"}
              </Text>
              <Text style={styles.hint}>
                {form.isOpen
                  ? "Buyers can see your listings and contact you."
                  : "Your listings are hidden from buyers until you reopen."}
              </Text>
            </View>
            <Switch
              value={form.isOpen}
              onValueChange={(v) => update("isOpen", v)}
              trackColor={{ true: colors.primary, false: colors.divider }}
              thumbColor={colors.white}
            />
          </View>

          <AppTextInput
            label="Business name"
            placeholder="Enter your business name"
            value={form.businessName}
            onChangeText={(t) => update("businessName", t)}
            maxLength={60}
          />
          <AppTextInput
            label="About your shop"
            placeholder="What you sell, what makes you different..."
            value={form.description}
            onChangeText={(t) => update("description", t)}
            multiline
            maxLength={500}
            style={styles.multiline}
          />
          <AppTextInput
            label="Location"
            placeholder="e.g. Makola Market, Accra"
            value={form.location}
            onChangeText={(t) => update("location", t)}
          />
          <AppTextInput
            label="Contact phone"
            placeholder="e.g. 024 000 0000"
            value={form.phone}
            onChangeText={(t) => update("phone", t)}
            keyboardType="phone-pad"
          />
          <AppTextInput
            label="Opening hours"
            placeholder="e.g. Mon – Sat, 8:00am – 6:00pm"
            value={form.openingHours}
            onChangeText={(t) => update("openingHours", t)}
          />

          <View>
            <Text style={styles.label}>What do you sell?</Text>
            <Text style={styles.hint}>Pick all that apply.</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={form.categories.includes(c)}
                  onPress={() => toggleCategory(c)}
                />
              ))}
            </View>
          </View>

          <PrimaryButton
            label={isDirty ? "Save changes" : "No changes"}
            onPress={handleSave}
            disabled={!canSave}
            loading={isSaving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  error: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.danger, textAlign: "center" },
  content: { padding: 20, paddingBottom: 40, gap: 18 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: -12 },
  photoSection: { alignItems: "center" },
  photoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoImage: { width: "100%", height: "100%" },
  uploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: -16,
  },
  uploadLabel: { color: colors.white, fontSize: 12, fontFamily: fonts.headline },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
  },
  openTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  hint: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  label: { fontSize: 16, fontFamily: fonts.headline, color: colors.text, marginBottom: 4 },
  multiline: { height: 100, paddingTop: 12, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
});
