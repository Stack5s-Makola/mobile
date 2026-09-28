// Minimal reader for a JWT's payload. Used because POST /api/login returns no
// user id in its body - the id is only in the token's `sub` claim.
//
// This does NOT verify the signature: that is the server's job. It only reads
// claims the server has already vouched for by issuing the token.
//
// Decoding is done by hand rather than with atob(), which isn't guaranteed to
// exist across every React Native runtime.

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64Url(input: string): string {
  const cleaned = input.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const character of cleaned) {
    const index = BASE64.indexOf(character);
    if (index === -1) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export type JwtClaims = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

/** The token's claims, or an empty object if it can't be read. */
export function decodeJwtClaims(token: string | null | undefined): JwtClaims {
  if (!token) return {};
  const payload = token.split(".")[1];
  if (!payload) return {};
  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return {};
  }
}
