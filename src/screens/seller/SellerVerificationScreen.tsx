import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CircleAlert,
  Clock,
  FileText,
  ShieldAlert,
} from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { Chip } from "@components/Chip";
import { PrimaryButton } from "@components/PrimaryButton";
import { DOCUMENT_TYPE_LABELS } from "@constants/sellerStatus";
import { colors, fonts, radii } from "@constants/theme";
import { SellerStackProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import {
  Verification,
  VerificationDocumentType,
  VerificationStatus,
} from "@types/seller";
import { formatDate } from "@utils/format";
import { pickImage } from "@utils/pickImage";

const STATUS_CARD: Record<
  VerificationStatus,
  { title: string; body: string; icon: typeof Clock; fg: string; bg: string }
> = {
  NOT_STARTED: {
    title: "Get verified",
    body: "Verified sellers get a badge on their shop and listings, so buyers know they're dealing with a real business.",
    icon: ShieldAlert,
    fg: colors.primary,
    bg: colors.primarySoft,
  },
  PENDING: {
    title: "Under review",
    body: "Thanks! Your documents were submitted and are waiting for review. We'll notify you once they've been checked.",
    icon: Clock,
    fg: colors.warning,
    bg: colors.warningSoft,
  },
  VERIFIED: {
    title: "You're verified",
    body: "Your shop shows the verified badge to buyers.",
    icon: BadgeCheck,
    fg: colors.primary,
    bg: colors.primarySoft,
  },
  REJECTED: {
    title: "Verification rejected",
    body: "Your documents couldn't be approved. Please check the reason below and submit again.",
    icon: CircleAlert,
    fg: colors.danger,
    bg: colors.dangerSoft,
  },
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as VerificationDocumentType[];

export function SellerVerificationScreen({ navigation }: SellerStackProps<"Verification">) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [documentType, setDocumentType] = useState<VerificationDocumentType>("GHANA_CARD");
  const [idNumber, setIdNumber] = useState("");
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await sellerService.getVerification();
      if (res.success) {
        setVerification(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load your verification status.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const canSubmit = idNumber.trim().length >= 5 && Boolean(documentUri) && Boolean(selfieUri);

  async function handleSubmit() {
    if (!documentUri || !selfieUri) return;
    setIsSubmitting(true);
    try {
      const res = await sellerService.submitVerification({
        documentType,
        idNumber: idNumber.trim(),
        documentUri,
        selfieUri,
      });
      if (res.success) {
        setVerification(res.data);
      } else {
        Alert.alert("Couldn't submit", res.message);
      }
    } catch {
      Alert.alert("Couldn't submit", "Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!verification) {
    return (
      <SafeAreaView style={styles.loading}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.backLink} onPress={() => navigation.goBack()}>
              Go back
            </Text>
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  const card = STATUS_CARD[verification.status];
  const canEdit = verification.status === "NOT_STARTED" || verification.status === "REJECTED";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={26} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>Verification</Text>
          </View>

          <View style={[styles.statusCard, { backgroundColor: card.bg }]}>
            <card.icon size={28} color={card.fg} />
            <View style={styles.flex}>
              <Text style={[styles.statusTitle, { color: card.fg }]}>{card.title}</Text>
              <Text style={styles.statusBody}>{card.body}</Text>
            </View>
          </View>

          {verification.status === "REJECTED" && verification.rejectionReason ? (
            <View style={styles.reason}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonBody}>{verification.rejectionReason}</Text>
            </View>
          ) : null}

          {!canEdit ? (
            <View style={styles.summary}>
              {verification.documentType ? (
                <SummaryRow
                  label="Document"
                  value={DOCUMENT_TYPE_LABELS[verification.documentType]}
                />
              ) : null}
              {verification.idNumber ? (
                <SummaryRow label="ID number" value={maskId(verification.idNumber)} />
              ) : null}
              {verification.submittedAt ? (
                <SummaryRow label="Submitted" value={formatDate(verification.submittedAt)} />
              ) : null}
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.label}>1. Choose your ID type</Text>
                <View style={styles.chips}>
                  {DOCUMENT_TYPES.map((type) => (
                    <Chip
                      key={type}
                      label={DOCUMENT_TYPE_LABELS[type]}
                      selected={documentType === type}
                      onPress={() => setDocumentType(type)}
                    />
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.label}>2. Enter the ID number</Text>
                <AppTextInput
                  placeholder={
                    documentType === "GHANA_CARD" ? "e.g. GHA-000000000-0" : "Enter ID number"
                  }
                  value={idNumber}
                  onChangeText={setIdNumber}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text style={styles.label}>3. Add photos</Text>
                <View style={styles.uploads}>
                  <UploadTile
                    label={`Photo of your ${DOCUMENT_TYPE_LABELS[documentType]}`}
                    icon={<FileText size={24} color={colors.primary} />}
                    uri={documentUri}
                    onPress={async () => {
                      const uri = await pickImage({ askSource: true });
                      if (uri) setDocumentUri(uri);
                    }}
                  />
                  <UploadTile
                    label="Selfie holding your ID"
                    icon={<Camera size={24} color={colors.primary} />}
                    uri={selfieUri}
                    onPress={async () => {
                      const uri = await pickImage({ askSource: true });
                      if (uri) setSelfieUri(uri);
                    }}
                  />
                </View>
                <Text style={styles.hint}>
                  Make sure all details are clear and readable, with no glare.
                </Text>
              </View>

              <PrimaryButton
                label={verification.status === "REJECTED" ? "Resubmit for review" : "Submit for review"}
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={isSubmitting}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function maskId(id: string) {
  return id.length <= 4 ? id : `${"•".repeat(Math.min(id.length - 4, 8))}${id.slice(-4)}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function UploadTile({
  label,
  icon,
  uri,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  uri: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.uploadTile, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={uri ? `Replace ${label}` : `Add ${label}`}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.uploadImage} />
          <View style={styles.replaceTag}>
            <Text style={styles.replaceLabel}>Replace</Text>
          </View>
        </>
      ) : (
        <>
          {icon}
          <Text style={styles.uploadLabel}>{label}</Text>
        </>
      )}
    </Pressable>
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
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  backLink: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.primary, marginTop: 16 },
  statusCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: radii.card,
    padding: 16,
    alignItems: "flex-start",
  },
  statusTitle: { fontSize: 17, fontFamily: fonts.bodySemiBold },
  statusBody: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 4, lineHeight: 20 },
  reason: { backgroundColor: colors.white, borderRadius: radii.card, padding: 14 },
  reasonLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.danger },
  reasonBody: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 4 },
  summary: { backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: 14 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  summaryLabel: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  summaryValue: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.text },
  label: { fontSize: 16, fontFamily: fonts.headline, color: colors.text, marginBottom: 10 },
  hint: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  uploads: { flexDirection: "row", gap: 12 },
  uploadTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    overflow: "hidden",
  },
  pressed: { opacity: 0.85 },
  uploadImage: { ...StyleSheet.absoluteFillObject },
  uploadLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
    textAlign: "center",
  },
  replaceTag: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  replaceLabel: { color: colors.white, fontSize: 11, fontFamily: fonts.bodySemiBold },
});
