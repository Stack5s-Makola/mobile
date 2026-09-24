import React, { useState, ReactNode } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, ImageIcon, X } from "lucide-react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { CATEGORIES, getCategoryLabel } from "@constants/categories";
import { colors, fonts, radii } from "@constants/theme";
import { SellerStackProps } from "@navigation/sellerRoutes";
import { pickImage } from "@utils/pickImage";

// UI only for now - nothing is submitted yet. The Create tab opens this.
//
// TODO(connect): POST the product once the endpoint is settled. /api/products
// exists but wants a sellerId the app can't currently obtain, and product
// images have no upload path yet (the seller profile picture goes up as a
// multipart `image`, so this will likely follow the same shape).

export function AddProductScreen({ navigation }: SellerStackProps<"AddProduct">) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");

  async function handlePickImage() {
    const uri = await pickImage({ aspect: [4, 3] });
    if (uri) setImageUri(uri);
  }

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
        <Text style={styles.headerTitle}>Add Product</Text>
        {/* Balances the arrow so the title stays optically centred. */}
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInset={{ bottom: KEYBOARD_GAP }}
      >
        <Field label="Product Image">
          <Pressable
            style={styles.upload}
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Upload product image"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <>
                <ImageIcon size={34} color="#9AA5A1" />
                <Text style={styles.uploadPrompt}>
                  <Text style={styles.uploadPromptAccent}>Click to upload</Text>
                  {"  or drag and drop"}
                </Text>
                <Text style={styles.uploadHint}>JPG, JPEG, PNG less than 1MB</Text>
              </>
            )}
          </Pressable>
        </Field>

        <Field label="Product Name">
          <TextInput
            style={styles.input}
            placeholder="Enter the name of the product"
            placeholderTextColor={PLACEHOLDER}
            value={name}
            onChangeText={setName}
          />
        </Field>

        <Field label="Categories">
          <Select
            value={category}
            placeholder="Select category"
            onSelect={setCategory}
          />
        </Field>

        <Field label="Tags">
          <TagsInput tags={tags} onChange={setTags} />
        </Field>

        <Field label="Price">
          <TextInput
            style={styles.input}
            placeholder="Enter the price"
            placeholderTextColor={PLACEHOLDER}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Tell buyers about your products"
            placeholderTextColor={PLACEHOLDER}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label="Location">
          <TextInput
            style={styles.input}
            placeholder="Where is your shop located"
            placeholderTextColor={PLACEHOLDER}
            value={location}
            onChangeText={setLocation}
          />
        </Field>

        <Field label="Quantity">
          <TextInput
            style={styles.input}
            placeholderTextColor={PLACEHOLDER}
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
        </Field>

        <PrimaryButton
          label="Add Product"
          onPress={() =>
            navigation.navigate("ProductPreview", {
              imageUri,
              name,
              category,
              tags,
              price,
              description,
              location,
              quantity,
            })
          }
          style={styles.submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// Type and press comma to commit a tag. The comma never reaches the field -
// whatever preceded it becomes a chip and the rest stays as the draft, so
// pasting "red, cotton, large" lands three tags at once.
function TagsInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleChangeText(text: string) {
    if (!text.includes(",")) {
      setDraft(text);
      return;
    }
    const parts = text.split(",");
    const committed = parts.slice(0, -1).map((part) => part.trim());
    const next = [...tags];
    for (const tag of committed) {
      if (tag && !next.includes(tag)) next.push(tag);
    }
    onChange(next);
    setDraft(parts[parts.length - 1] ?? "");
  }

  return (
    <View style={[styles.input, styles.tagsField]}>
      {tags.map((tag) => (
        <Pressable
          key={tag}
          style={styles.tag}
          onPress={() => onChange(tags.filter((t) => t !== tag))}
          accessibilityRole="button"
          accessibilityLabel={`Remove tag ${tag}`}
        >
          <Text style={styles.tagLabel}>{tag}</Text>
          <X size={13} color={colors.white} strokeWidth={3} />
        </Pressable>
      ))}
      <TextInput
        style={styles.tagInput}
        placeholder={tags.length === 0 ? "Type a tag, then a comma" : ""}
        placeholderTextColor={PLACEHOLDER}
        value={draft}
        onChangeText={handleChangeText}
        autoCapitalize="none"
      />
    </View>
  );
}

// Tapping opens an inline list rather than a native picker, so it looks the
// same on both platforms.
function Select({
  value,
  placeholder,
  onSelect,
}: {
  value: string | null;
  placeholder: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Pressable
        style={styles.input}
        onPress={() => setIsOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value ? getCategoryLabel(value) : placeholder}
        </Text>
        <ChevronDown size={22} color={colors.text} />
      </Pressable>

      {isOpen ? (
        <View style={styles.options}>
          {CATEGORIES.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                }}
                accessibilityRole="button"
              >
                <Icon size={18} color={GREEN} />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// Same green as the seller profile page.
const GREEN = "#1CA30A";
const BORDER = "#E3E9E6";
const PLACEHOLDER = "#8D9894";

// Breathing room between the focused field and the keyboard.
const KEYBOARD_GAP = 40;

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
  content: { padding: 20, paddingBottom: 40, gap: 18 },

  field: { gap: 8 },
  label: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: GREEN },

  upload: {
    height: 170,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  uploadPreview: { width: "100%", height: "100%" },
  uploadPrompt: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text },
  uploadPromptAccent: { fontFamily: fonts.bodySemiBold, color: GREEN },
  uploadHint: { fontSize: 12, fontFamily: fonts.bodyRegular, color: PLACEHOLDER },

  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  textarea: { minHeight: 130, paddingTop: 16, paddingBottom: 16 },
  // Wraps instead of a single row, and grows as chips are added.
  tagsField: {
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
    paddingVertical: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.white },
  tagInput: {
    flexGrow: 1,
    minWidth: 120,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    paddingVertical: 4,
  },
  selectValue: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.text },
  selectPlaceholder: { fontSize: 15, fontFamily: fonts.bodyRegular, color: PLACEHOLDER },

  options: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    overflow: "hidden",
  },
  option: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  optionPressed: { backgroundColor: colors.background },
  optionLabel: { fontSize: 15, fontFamily: fonts.bodyRegular, color: colors.text },

  // PrimaryButton draws a 3px border in the theme's dark green; overriding
  // only the fill left a dark ring around the lighter green.
  submit: { marginTop: 10, backgroundColor: GREEN, borderWidth: 0 },
});
