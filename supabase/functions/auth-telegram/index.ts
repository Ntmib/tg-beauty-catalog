/**
 * POST /functions/v1/auth/telegram
 *
 * Валидирует Telegram initData и возвращает JWT для работы с Supabase.
 *
 * Два режима:
 *   ЭТАП А — новый мастер (открыл @Beauty_100master_bot):
 *     initData проверяется токеном ПЛАТФОРМЕННОГО бота
 *
 *   ЭТАП Б — подключённый мастер / клиент (открыл бота мастера):
 *     initData проверяется токеном БОТА МАСТЕРА (находим по bot_id из запроса)
 *
 * Тело запроса:
 *   { initData: string, bot_id?: number }
 *
 * Ответ:
 *   { access_token: string, role: "master"|"client", master_id?: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { verifyInitData, parseUserFromInitData } from "../_shared/telegram.ts";
import { decryptToken } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PLATFORM_BOT_TOKEN = Deno.env.get("PLATFORM_BOT_TOKEN")!;
const PLATFORM_BOT_ID = parseInt(Deno.env.get("PLATFORM_BOT_ID") ?? "0");
const JWT_SECRET = Deno.env.get("JWT_SECRET")!; // из Supabase Settings → API → JWT Secret

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Cors headers для Telegram Mini App
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const { initData, bot_id } = await req.json() as {
      initData: string;
      bot_id?: number;
    };

    if (!initData) {
      return json({ error: "initData required" }, 400);
    }

    // ── Определяем режим: платформенный бот или бот мастера ──────────
    const isPlatformBot = !bot_id || bot_id === PLATFORM_BOT_ID;

    let botToken: string;
    let masterFromDb: Record<string, unknown> | null = null;

    if (isPlatformBot) {
      // ЭТАП А: новый мастер открыл платформенного бота
      botToken = PLATFORM_BOT_TOKEN;
    } else {
      // ЭТАП Б: клиент или мастер открыл бота мастера
      const { data: master } = await supabase
        .from("masters")
        .select("*")
        .eq("bot_id", bot_id)
        .eq("is_bot_active", true)
        .single();

      if (!master) {
        return json({ error: "Bot not found" }, 404);
      }

      masterFromDb = master;
      botToken = await decryptToken(master.bot_token_enc as string);
    }

    // ── Проверяем подпись initData ────────────────────────────────────
    const isValid = await verifyInitData(initData, botToken);
    if (!isValid) {
      return json({ error: "Invalid initData signature" }, 401);
    }

    // ── Парсим пользователя ───────────────────────────────────────────
    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) {
      return json({ error: "No user in initData" }, 400);
    }

    const telegramId = tgUser.id;

    // ── Определяем роль ───────────────────────────────────────────────
    let role: "master" | "client";
    let masterId: string | null = null;

    // Проверяем: этот telegram_id есть в таблице masters?
    const { data: masterRecord } = await supabase
      .from("masters")
      .select("id, telegram_id")
      .eq("telegram_id", telegramId)
      .single();

    if (masterRecord) {
      // Это мастер
      role = "master";
      masterId = masterRecord.id as string;
    } else {
      // Это клиент
      role = "client";
      // masterId — это мастер чей бот открыт
      if (masterFromDb) {
        masterId = masterFromDb.id as string;
      }
    }

    // ── Создаём или обновляем запись в masters (для нового мастера) ───
    if (isPlatformBot && !masterRecord) {
      const { data: newMaster } = await supabase
        .from("masters")
        .insert({
          telegram_id: telegramId,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name ?? null,
          username: tgUser.username ?? null,
          plan: "free",
        })
        .select("id")
        .single();

      if (newMaster) {
        masterId = newMaster.id as string;
        role = "master";
      }
    }

    // Обновляем last_active_at для мастера
    if (masterRecord) {
      await supabase
        .from("masters")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", masterId);
    }

    // ── Создаём клиента если не существует ───────────────────────────
    if (role === "client" && masterId) {
      await supabase
        .from("clients")
        .upsert(
          {
            master_id: masterId,
            telegram_id: telegramId,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name ?? null,
            username: tgUser.username ?? null,
          },
          { onConflict: "master_id,telegram_id" },
        );
    }

    // ── Генерируем JWT ────────────────────────────────────────────────
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const payload = {
      iss: "supabase",
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60 * 24 * 7), // 7 дней
      sub: String(telegramId),
      role: "authenticated",
      app_role: role,
      app_master_id: masterId,
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    return json({
      access_token: token,
      role,
      master_id: masterId,
      user: {
        telegram_id: telegramId,
        first_name: tgUser.first_name,
        username: tgUser.username,
      },
    });
  } catch (err) {
    console.error("auth/telegram error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
