export function formatPrice(amount: number): string {
  return `GH₵ ${amount.toFixed(2)}`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function firstName(fullName: string | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// Strips thousands separators, spaces and currency symbols from a typed
// amount. "4,595.00" reaches the API as "4595.00" - sent as-is it parses to
// NaN server-side and comes back as "price must be greater than 0".
export function normalizeAmount(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  // Keep only the first decimal point ("1.2.3" -> "1.23").
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
}

// Whole numbers only - same problem, no decimal part.
export function normalizeCount(input: string): string {
  return input.replace(/\D/g, "");
}
