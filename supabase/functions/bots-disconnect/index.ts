/**
 * POST /functions/v1/bots/disconnect
 *
 * Мастер отключает своего бота.
 *
 * Что делает:
 *   1. Находим мастера по masterId из JWT
 *   2. Расшифровываем токен
 *   3. deleteWebhook в Telegram
 *   4. Очищаем bot_token_enc, bot_id, bot_username, is_bot_active в БД
 *
 * Авторизация: Bearer JWT
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";
import { callBotApi } from "../_shared/telegram.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const masterId = getMasterIdFromJwt(req);
    if (!masterId) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Находим мастера
    const { data: master } = await supabase
      .from("masters")
      .select("bot_token_enc, bot_id, is_bot_active")
      .eq("id", masterId)
      .single();

    if (!master?.is_bot_active || !master.bot_token_enc) {
      return json({ error: "Бот не подключён" }, 400);
    }

    // deleteWebhook
    try {
      const token = await decryptToken(master.bot_token_enc as string);
      await callBotApi(token, "deleteWebhook", { drop_pending_updates: false });
    } catch (e) {
      console.error("deleteWebhook error:", e);
      // Продолжаем даже если Telegram недоступен
    }

    // Очищаем в БД
    await supabase
      .from("masters")
      .update({
        bot_token_enc: null,
        bot_id: null,
        bot_username: null,
        is_bot_active: false,
      })
      .eq("id", masterId);

    return json({ ok: true });
  } catch (err) {
    console.error("bots/disconnect error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function getMasterIdFromJwt(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.app_master_id ?? null;
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
