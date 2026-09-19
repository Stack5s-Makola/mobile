import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@constants/theme";

type Props = {
  label: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ label, icon, active, onPress }: Props) {
  return (
    <Pressable
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary },
  chipInactive: { backgroundColor: colors.neutralSoft },
  icon: { fontSize: 14 },
  label: { fontSize: 12, fontFamily: fonts.bodyMedium },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.primary },
});
