import React from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";

export function AppTextInput(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#999" {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    width: "100%",
  },
});
