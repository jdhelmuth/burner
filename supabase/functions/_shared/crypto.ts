const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toBase64(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}

async function importAesKey() {
  const rawKey = Deno.env.get("FIELD_ENCRYPTION_KEY");
  if (!rawKey) {
    throw new Error("FIELD_ENCRYPTION_KEY is not configured");
  }

  return crypto.subtle.importKey("raw", fromBase64(rawKey), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJson(payload: unknown) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );

  return JSON.stringify({
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  });
}

export async function decryptJson<T>(payload: string): Promise<T> {
  const key = await importAesKey();
  const parsed = JSON.parse(payload) as { iv: string; ciphertext: string };
  const clearBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.ciphertext),
  );

  return JSON.parse(decoder.decode(clearBuffer)) as T;
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
