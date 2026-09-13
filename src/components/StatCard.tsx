import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radii } from "@constants/theme";

type Props = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

export function StatCard({ label, value, icon }: Props) {
  return (
    <View style={styles.card}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: { fontSize: 22, fontFamily: fonts.headline, color: colors.text },
  label: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: 2 },
});
