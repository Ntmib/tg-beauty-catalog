/**
 * POST /functions/v1/bookings/notify
 *
 * Уведомить мастера о новой записи через его бота.
 * Вызывается фронтендом после успешного создания записи.
 *
 * Тело: { booking_id: string }
 * Авторизация: Bearer JWT (клиент или мастер)
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
    const { booking_id } = await req.json() as { booking_id: string };
    if (!booking_id) {
      return json({ error: "booking_id required" }, 400);
    }

    // Получаем запись со всеми связями
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        *,
        services(title, duration, price),
        clients(first_name, last_name, username, telegram_id),
        masters(telegram_id, bot_token_enc, is_bot_active)
      `)
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return json({ error: "Booking not found" }, 404);
    }

    const master = booking.masters as Record<string, unknown>;
    const client = booking.clients as Record<string, unknown>;
    const service = booking.services as Record<string, unknown>;

    if (!master.is_bot_active || !master.bot_token_enc) {
      // У мастера нет бота — тихо пропускаем
      return json({ ok: true, sent: false });
    }

    // Форматируем дату и время
    const dateStr = new Date(booking.booking_date as string).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "short",
    });
    const timeStr = (booking.booking_time as string).slice(0, 5); // HH:MM
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(" ");
    const clientUsername = client.username ? ` (@${client.username})` : "";

    const text = [
      `📅 <b>Новая запись!</b>`,
      ``,
      `👤 Клиент: <b>${clientName}</b>${clientUsername}`,
      `✂️ Услуга: <b>${service.title}</b>`,
      `📆 Дата: <b>${dateStr}</b>`,
      `🕐 Время: <b>${timeStr}</b>`,
      `⏱ Длительность: ${service.duration} мин`,
      `💰 Стоимость: ${service.price}₽`,
      booking.client_comment ? `\n💬 Комментарий: ${booking.client_comment}` : "",
    ].filter((l) => l !== undefined).join("\n");

    const token = await decryptToken(master.bot_token_enc as string);
    await callBotApi(token, "sendMessage", {
      chat_id: master.telegram_id,
      text,
      parse_mode: "HTML",
    });

    return json({ ok: true, sent: true });
  } catch (err) {
    console.error("bookings/notify error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
