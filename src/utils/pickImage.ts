import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

type Source = "camera" | "library";

type Options = {
  aspect?: [number, number];
  // Ask "Take photo / Choose from library" first. Otherwise opens the library.
  askSource?: boolean;
};

function askForSource(): Promise<Source | null> {
  return new Promise((resolve) => {
    Alert.alert("Add photo", undefined, [
      { text: "Take photo", onPress: () => resolve("camera") },
      { text: "Choose from library", onPress: () => resolve("library") },
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}

// Returns the picked image's local URI, or null if the user cancelled or
// denied permission (permission denial shows its own alert).
export async function pickImage({ aspect, askSource = false }: Options = {}): Promise<
  string | null
> {
  const source = askSource ? await askForSource() : "library";
  if (!source) return null;

  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permission needed",
      source === "camera"
        ? "Allow camera access to take a photo."
        : "Allow photo library access to choose a photo."
    );
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: Boolean(aspect),
    aspect,
    quality: 0.7,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  return result.canceled ? null : result.assets[0].uri;
}
