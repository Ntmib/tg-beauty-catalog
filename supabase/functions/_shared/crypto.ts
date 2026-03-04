/**
 * AES-256-GCM шифрование для хранения токенов ботов.
 * Тот же алгоритм что в bot-server/crypto.py — ключи взаимозаменяемы.
 */

const KEY_HEX = Deno.env.get("TOKEN_ENCRYPTION_KEY") ?? "";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(KEY_HEX),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Зашифровать токен бота → base64(nonce + ciphertext) */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    encoded,
  );
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(nonce, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

/** Расшифровать base64(nonce + ciphertext) → токен бота */
export async function decryptToken(b64: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const nonce = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}
