/**
 * Утилиты для работы с Telegram:
 * - Валидация initData (HMAC-SHA256)
 * - Вызовы Bot API
 */

/** Проверить подпись initData по токену бота */
export async function verifyInitData(
  initData: string,
  botToken: string,
): Promise<boolean> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  // Собираем строку проверки (все поля кроме hash, отсортированные)
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // HMAC-SHA256: key = HMAC("WebAppData", botToken), data = dataCheckString
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const keyBytes = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(botToken),
  );
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckString),
  );

  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === hash;
}

/** Распарсить user из initData */
export function parseUserFromInitData(
  initData: string,
): { id: number; first_name: string; last_name?: string; username?: string } | null {
  const params = new URLSearchParams(initData);
  const userStr = params.get("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/** Получить bot_id из initData (поле chat_instance или парсим user.id из bot) */
export function getBotIdFromInitData(initData: string): number | null {
  // Telegram кладёт id бота в заголовок, но в initData его нет напрямую.
  // bot_id мы получаем через getMe по токену.
  // Здесь возвращаем null — определение происходит снаружи.
  return null;
}

/** Вызов Telegram Bot API */
export async function callBotApi(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) {
    throw new Error(`Telegram API ${method}: ${json.description}`);
  }
  return json.result;
}
