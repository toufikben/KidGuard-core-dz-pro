// Lightweight secret hashing for PIN codes using the
// browser's built-in Web Crypto API (SubtleCrypto). This keeps secrets out of
// localStorage in plaintext so they aren't trivially readable via devtools ->
// Application -> Local Storage, or by anything else that can read app storage.
//
// Note: this is a client-side, unsalted SHA-256 digest. It is a meaningful
// improvement over plaintext storage for a local-only app, but it is not a
// substitute for a server-side auth system with per-user salts + a slow KDF
// (bcrypt/scrypt/argon2) if this app ever grows a real backend.

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string): Promise<string> {
  return sha256Hex(`kidguard:pin:${pin}`);
}
