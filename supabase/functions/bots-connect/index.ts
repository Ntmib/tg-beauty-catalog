/**
 * POST /functions/v1/bots/connect
 *
 * Мастер вставляет токен своего бота → подключаем его.
 *
 * Что делает:
 *   1. Telegram getMe → bot_id, bot_username (проверяем что токен валиден)
 *   2. Проверяем что бот не привязан к другому мастеру
 *   3. Шифруем токен AES-256-GCM
 *   4. Сохраняем в masters (bot_token_enc, bot_id, bot_username, is_bot_active=true)
 *   5. setWebhook → https://beauty.mcdenil.com/webhook/bot{bot_id}
 *   6. setChatMenuButton → кнопка "Открыть каталог"
 *   7. setMyCommands → /start, /help
 *   8. setMyDescription, setMyShortDescription
 *
 * Авторизация: Bearer JWT (из auth/telegram)
 * Тело: { bot_token: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";
import { callBotApi } from "../_shared/telegram.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VPS_BASE_URL = Deno.env.get("VPS_BASE_URL")!; // https://beauty.mcdenil.com
const MINI_APP_URL = Deno.env.get("MINI_APP_URL")!; // https://tg-app-khaki.vercel.app

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
    // ── Получаем master_id из JWT ─────────────────────────────────────
    const masterId = getMasterIdFromJwt(req);
    if (!masterId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { bot_token } = await req.json() as { bot_token: string };
    if (!bot_token?.trim()) {
      return json({ error: "bot_token required" }, 400);
    }

    const token = bot_token.trim();

    // ── 1. Проверяем токен через Telegram getMe ──────────────────────
    let botInfo: { id: number; username: string; first_name: string };
    try {
      botInfo = await callBotApi(token, "getMe", {}) as typeof botInfo;
    } catch {
      return json({ error: "Неверный токен бота. Проверьте его в @BotFather." }, 422);
    }

    const botId = botInfo.id;
    const botUsername = botInfo.username;

    // ── 2. Проверяем что бот не привязан к другому мастеру ───────────
    const { data: existingMaster } = await supabase
      .from("masters")
      .select("id")
      .eq("bot_id", botId)
      .neq("id", masterId)
      .single();

    if (existingMaster) {
      return json({ error: "Этот бот уже подключён к другому мастеру." }, 409);
    }

    // ── 3. Шифруем токен ─────────────────────────────────────────────
    const encryptedToken = await encryptToken(token);

    // ── 4. Сохраняем в БД ────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("masters")
      .update({
        bot_token_enc: encryptedToken,
        bot_id: botId,
        bot_username: botUsername,
        is_bot_active: true,
      })
      .eq("id", masterId);

    if (updateError) {
      console.error("DB update error:", updateError);
      return json({ error: "Ошибка сохранения" }, 500);
    }

    // ── 5. setWebhook ─────────────────────────────────────────────────
    const webhookUrl = `${VPS_BASE_URL}/webhook/bot${botId}`;
    try {
      await callBotApi(token, "setWebhook", {
        url: webhookUrl,
        allowed_updates: ["message", "callback_query", "pre_checkout_query", "successful_payment"],
      });
    } catch (e) {
      console.error("setWebhook error:", e);
      // Не критично — продолжаем
    }

    // ── 6. setChatMenuButton — кнопка "Открыть каталог" ──────────────
    try {
      await callBotApi(token, "setChatMenuButton", {
        menu_button: {
          type: "web_app",
          text: "Открыть каталог",
          web_app: { url: MINI_APP_URL },
        },
      });
    } catch (e) {
      console.error("setChatMenuButton error:", e);
    }

    // ── 7. setMyCommands ──────────────────────────────────────────────
    try {
      await callBotApi(token, "setMyCommands", {
        commands: [
          { command: "start", description: "Открыть каталог" },
          { command: "help", description: "Помощь и контакты" },
        ],
      });
    } catch (e) {
      console.error("setMyCommands error:", e);
    }

    // ── 8. setMyDescription + setMyShortDescription ───────────────────
    try {
      await callBotApi(token, "setMyDescription", {
        description:
          "Это бот записи онлайн к вашему мастеру 💅\n\nНажмите кнопку «Открыть каталог» чтобы посмотреть услуги и записаться.",
      });
      await callBotApi(token, "setMyShortDescription", {
        short_description: "Запись онлайн к мастеру",
      });
    } catch (e) {
      console.error("setMyDescription error:", e);
    }

    return json({
      ok: true,
      bot_id: botId,
      bot_username: `@${botUsername}`,
      webhook_url: webhookUrl,
    });
  } catch (err) {
    console.error("bots/connect error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

/** Извлечь app_master_id из Authorization: Bearer <jwt> */
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
