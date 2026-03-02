/**
 * Webhook-обработчик Telegram бота
 *
 * Vercel Serverless Function — принимает сообщения от Telegram,
 * отвечает на /start, /help и deep-link из оффера.
 */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = 'https://tg-app-khaki.vercel.app';
const MASTER_USERNAME = 'anna_master'; // Telegram мастера для связи

/**
 * Отправить сообщение через Telegram API
 */
async function sendMessage(chatId, text, extra = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extra,
    }),
  });
}

/**
 * Обработка входящего сообщения
 */
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const firstName = message.from?.first_name || 'друг';

  // /start from_app — пришёл из оффера в Mini App
  if (text.startsWith('/start from_app')) {
    await sendMessage(chatId,
      `🎁 <b>Ваш промокод: BEAUTY15</b>\n\n` +
      `Скидка 15% на первую запись!\n` +
      `Просто назовите промокод при записи.\n\n` +
      `Нажми «Каталог» внизу, чтобы выбрать услугу 👇`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '💅 Выбрать услугу', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
    return;
  }

  // /start — обычный запуск
  if (text === '/start') {
    await sendMessage(chatId,
      `Привет, ${firstName}! 👋\n\n` +
      `Я — бот бьюти-мастера. Здесь можно:\n\n` +
      `💅 Посмотреть услуги и цены\n` +
      `📸 Портфолио работ\n` +
      `📅 Записаться онлайн\n\n` +
      `Нажми <b>«Каталог»</b> внизу — откроется приложение 👇`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📋 Открыть каталог', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
    return;
  }

  // /help — помощь
  if (text === '/help') {
    await sendMessage(chatId,
      `<b>Как пользоваться:</b>\n\n` +
      `📋 Нажми кнопку <b>«Каталог»</b> внизу — откроется приложение с услугами\n` +
      `📅 Выбери услугу → дату → время → готово!\n\n` +
      `<b>Связаться с мастером:</b>\n` +
      `💬 Напиши @${MASTER_USERNAME}\n\n` +
      `Если что-то не работает — просто напиши сюда, мастер увидит.`
    );
    return;
  }

  // Любое другое сообщение — подсказка
  await sendMessage(chatId,
    `Я пока умею только открывать каталог 😊\n\n` +
    `Нажми <b>«Каталог»</b> внизу или /start`
  );
}

/**
 * Vercel Serverless Function — точка входа
 */
export default async function handler(req, res) {
  // GET — проверка что webhook жив
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, bot: 'Beauty_100master_bot' });
  }

  // POST — входящее обновление от Telegram
  if (req.method === 'POST') {
    try {
      const { message } = req.body || {};
      if (message) {
        await handleMessage(message);
      }
    } catch (err) {
      console.error('Webhook error:', err);
    }
    // Telegram ждёт 200 OK
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
