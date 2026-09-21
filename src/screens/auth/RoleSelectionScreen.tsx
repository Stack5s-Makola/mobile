import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts, radii } from "@constants/theme";
import { UserRole } from "@types/user";

// Sourced from Figma's temporary asset CDN (~7 day expiry) - see README.
const BUYER_ILLUSTRATION =
  "https://www.figma.com/api/mcp/asset/23cb35c7-bf16-404f-b011-dd71260ebc5f.png";
const SELLER_ILLUSTRATION =
  "https://www.figma.com/api/mcp/asset/3a72b22c-92e7-425d-a741-5dcafee7bc4b.png";

// First step after "Get started": the role is chosen before any details
// are typed, so the sign-up form can be framed for buyers or sellers.
//
// No backend call here - the role is just carried forward in nav params.
// The account is still created in one combined submission on the
// role-specific profile-setup screen.

export function RoleSelectionScreen({ navigation }: any) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  function handleContinue() {
    if (!selectedRole) return;
    navigation.navigate("Register", { role: selectedRole });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>How Will You Use Makola?</Text>

      <RoleCard
        illustration={BUYER_ILLUSTRATION}
        label="Buyer"
        description="Discover products and connect with sellers."
        selected={selectedRole === "BUYER"}
        onPress={() => setSelectedRole("BUYER")}
      />
      <RoleCard
        illustration={SELLER_ILLUSTRATION}
        label="Seller"
        description="List your products and reach more buyers."
        selected={selectedRole === "SELLER"}
        onPress={() => setSelectedRole("SELLER")}
      />

      <View style={styles.footer}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!selectedRole} />
      </View>
    </SafeAreaView>
  );
}

function RoleCard({
  illustration,
  label,
  description,
  selected,
  onPress,
}: {
  illustration: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: illustration }} style={styles.cardImage} resizeMode="contain" />
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      {selected ? (
        <CheckCircle2 size={28} color={colors.primary} />
      ) : (
        <Circle size={28} color="#ccc" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary, marginBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 30,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  cardImage: { width: 60, height: 60 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 20, fontFamily: fonts.headline, color: colors.primary },
  cardDescription: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 4 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
