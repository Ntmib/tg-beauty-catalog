/**
 * POST /functions/v1/broadcast
 *
 * Рассылка сообщения всем клиентам мастера через его бота.
 * Вызывается мастером из Mini App.
 *
 * Тело: { message: string }
 * Авторизация: Bearer JWT мастера (role = 'master')
 *
 * Алгоритм:
 *   1. Получить мастера из JWT (sub = telegram_id)
 *   2. Получить всех уникальных клиентов из таблицы clients
 *   3. Расшифровать токен мастерского бота
 *   4. Отправить сообщение каждому клиенту
 *   5. Вернуть { sent: N, failed: M }
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
    // Получаем JWT и достаём telegram_id мастера
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Декодируем payload (мы доверяем JWT, проверенному Supabase)
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    const masterTelegramId = payload.sub;
    const role = payload.role;

    if (role !== "master") {
      return json({ error: "Only masters can send broadcasts" }, 403);
    }

    const { message } = await req.json() as { message: string };
    if (!message || !message.trim()) {
      return json({ error: "message required" }, 400);
    }

    if (message.length > 4096) {
      return json({ error: "Message too long (max 4096 chars)" }, 400);
    }

    // Получаем данные мастера (bot_token_enc, bot_id, is_bot_active)
    const { data: master, error: masterError } = await supabase
      .from("masters")
      .select("id, telegram_id, first_name, bot_token_enc, bot_id, is_bot_active")
      .eq("telegram_id", masterTelegramId)
      .single();

    if (masterError || !master) {
      return json({ error: "Master not found" }, 404);
    }

    if (!master.is_bot_active || !master.bot_token_enc) {
      return json({ error: "Bot not connected. Connect your bot first." }, 400);
    }

    // Получаем всех уникальных клиентов мастера
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("telegram_id, first_name")
      .eq("master_id", master.id)
      .not("telegram_id", "is", null);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return json({ error: "Failed to fetch clients" }, 500);
    }

    if (!clients || clients.length === 0) {
      return json({ ok: true, sent: 0, failed: 0, total: 0 });
    }

    // Расшифровываем токен бота мастера
    const botToken = await decryptToken(master.bot_token_enc);

    // Отправляем сообщение каждому клиенту
    let sent = 0;
    let failed = 0;

    for (const client of clients) {
      try {
        await callBotApi(botToken, "sendMessage", {
          chat_id: client.telegram_id,
          text: message,
          parse_mode: "HTML",
        });
        sent++;
      } catch (err) {
        console.warn(`Failed to send to client ${client.telegram_id}:`, err);
        failed++;
      }

      // Небольшая пауза чтобы не превысить лимиты Telegram API (30 msg/sec)
      await new Promise((r) => setTimeout(r, 50));
    }

    console.log(`Broadcast from master ${masterTelegramId}: sent=${sent}, failed=${failed}`);

    return json({ ok: true, sent, failed, total: clients.length });
  } catch (err) {
    console.error("broadcast error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
