import { ListingStatus, VerificationDocumentType, VerificationStatus } from "@types/seller";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export const LISTING_STATUS_META: Record<ListingStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  DRAFT: { label: "Draft", tone: "neutral" },
  SOLD_OUT: { label: "Sold out", tone: "danger" },
};

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { label: string; tone: StatusTone }
> = {
  NOT_STARTED: { label: "Not verified", tone: "neutral" },
  PENDING: { label: "Under review", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

export const DOCUMENT_TYPE_LABELS: Record<VerificationDocumentType, string> = {
  GHANA_CARD: "Ghana Card",
  PASSPORT: "Passport",
  VOTERS_ID: "Voter's ID",
  DRIVERS_LICENSE: "Driver's License",
};
