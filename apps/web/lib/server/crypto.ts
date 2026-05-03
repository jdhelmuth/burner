const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getFieldEncryptionKey() {
  const value = process.env.FIELD_ENCRYPTION_KEY?.trim();
  if (!value) {
    throw new Error("FIELD_ENCRYPTION_KEY is not configured.");
  }
  return value;
}

function fromBase64(value: string) {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function fromHex(value: string) {
  if (value.length % 2 !== 0) {
    throw new Error("FIELD_ENCRYPTION_KEY hex value must have an even length.");
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function toBase64(value: Uint8Array) {
  return Buffer.from(value).toString("base64");
}

function parseEncryptionKey(rawKey: string) {
  const trimmed = rawKey.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return fromHex(trimmed);
  }
  return fromBase64(trimmed);
}

async function importAesKey() {
  return crypto.subtle.importKey(
    "raw",
    parseEncryptionKey(getFieldEncryptionKey()),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(payload: unknown) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );
  return JSON.stringify({ ciphertext: toBase64(ciphertext), iv: toBase64(iv) });
}

export async function decryptJson<T>(payload: string): Promise<T> {
  const key = await importAesKey();
  const parsed = JSON.parse(payload) as { ciphertext: string; iv: string };
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
