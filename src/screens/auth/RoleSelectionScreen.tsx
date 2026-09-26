import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Circle } from "lucide-react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts, radii } from "@constants/theme";
import { UserRole } from "@types/user";

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
        illustration={require("../../assets/buyer_icon.png")}
        label="Buyer"
        description="Discover products and connect with sellers."
        selected={selectedRole === "BUYER"}
        onPress={() => setSelectedRole("BUYER")}
      />
      <RoleCard
        illustration={require("../../assets/seller_icon.png")}
        label="Seller"
        description="List your products and reach more buyers."
        selected={selectedRole === "SELLER"}
        onPress={() => setSelectedRole("SELLER")}
      />

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!selectedRole}
        />
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
  illustration: number;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <Image
        source={illustration}
        style={styles.cardImage}
        resizeMode="contain"
      />
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      {selected ? (
        <View style={styles.selectedIndicator}>
          <Check size={14} color={colors.white} />
        </View>
      ) : (
        <Circle size={28} color={colors.divider} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    marginBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  cardImage: { width: 60, height: 60 },
  cardText: { flex: 1 },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 20,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    marginTop: 4,
  },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
