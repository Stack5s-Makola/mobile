// A colour per shop for its map label. Hashed from the id rather than picked
// at random, so a shop keeps the same colour between renders and across
// launches - a label that changes colour every frame would be worse than one
// fixed colour.

const PALETTE = [
  "#7C3AED", // violet
  "#DC2626", // red
  "#2563EB", // blue
  "#D97706", // amber
  "#0D9488", // teal
  "#DB2777", // pink
  "#4F46E5", // indigo
  "#15803D", // green
];

export function labelColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}
