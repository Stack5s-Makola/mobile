import React from "react";
import { View, Text, TextInput, TextInputProps, StyleSheet } from "react-native";
import { colors, fonts } from "@constants/theme";

type Props = TextInputProps & {
  label?: string;
  icon?: React.ReactNode;
};

export function AppTextInput({ label, icon, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style as object]}
          placeholderTextColor="#a7a0a0"
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.headline,
    marginBottom: 8,
  },
  inputRow: { position: "relative", justifyContent: "center" },
  icon: { position: "absolute", left: 14, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#a7a0a0",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    width: "100%",
    color: colors.text,
  },
  inputWithIcon: { paddingLeft: 46 },
});
