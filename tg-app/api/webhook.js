/**
 * Webhook @Beauty_100master_bot — платформенный бот для мастеров
 *
 * Этот бот только для мастеров — клиенты записываются
 * через личного бота каждого мастера (не через этот).
 *
 * Команды:
 *   /start  — приветствие и вход в приложение
 *   /help   — что такое этот бот и как начать
 *   /faq    — частые вопросы
 *   любой текст — подсказка с кнопкой
 */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = 'https://tg-app-khaki.vercel.app';
const SUPPORT_USERNAME = 'mcdenil'; // автор бота, контакт поддержки

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const firstName = message.from?.first_name || 'мастер';

  // /start — главное приветствие
  if (text === '/start' || text.startsWith('/start ')) {
    await sendMessage(chatId,
      `Привет, ${firstName}! 👋\n\n` +
      `Здесь ты откроешь <b>свой личный салон красоты</b> прямо в Telegram.\n\n` +
      `Что будет в твоём салоне:\n\n` +
      `✅ Витрина — клиент видит услуги, фото работ и цены\n` +
      `✅ Ресепшен — записывается сам, без переписки с тобой\n` +
      `✅ Администратор — напомнит о визите за 24ч и за 2ч\n` +
      `✅ Адрес — ссылка t.me/твой_бот, ничего скачивать не нужно\n\n` +
      `<b>Открытие салона — 3 минуты.</b> Жми кнопку ниже 👇`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '✨ Открыть мой салон', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
    return;
  }

  // /help — помощь и объяснение
  if (text === '/help') {
    await sendMessage(chatId,
      `<b>Что такое личный салон?</b>\n\n` +
      `Это твой персональный мини-сайт прямо в Telegram. ` +
      `Ты оформляешь витрину, а клиенты приходят сами.\n\n` +

      `<b>Как открыть салон:</b>\n` +
      `1. Нажми «Открыть мой салон» ниже\n` +
      `2. Повесь вывеску — имя, фото, специализация\n` +
      `3. Оформи витрину — добавь услуги\n` +
      `4. Подключи администратора — создай бота через @BotFather\n` +
      `5. Открой двери — отправь ссылку клиентам\n\n` +

      `<b>Сколько стоит?</b>\n` +
      `Открытие бесплатно. До 5 услуг — навсегда бесплатно.\n\n` +

      `<b>Есть вопросы?</b>\n` +
      `Пиши автору: @${SUPPORT_USERNAME}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '✨ Войти в мой салон', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
    return;
  }

  // /faq — частые вопросы
  if (text === '/faq') {
    await sendMessage(chatId,
      `<b>Частые вопросы</b>\n\n` +

      `<b>Нужно ли что-то скачивать?</b>\n` +
      `Нет — ваш салон работает прямо в Telegram.\n\n` +

      `<b>Как клиенты попадают в салон?</b>\n` +
      `Вы создаёте бота через @BotFather — это вывеска вашего салона. ` +
      `Клиент открывает бота → видит витрину → выбирает время → записывается.\n\n` +

      `<b>Что делает администратор?</b>\n` +
      `Когда клиент записывается, бот-администратор напоминает ему о визите ` +
      `за день и за 2 часа. Клиенты стали приходить намного чаще.\n\n` +

      `<b>Сколько услуг можно добавить на витрину?</b>\n` +
      `На бесплатном тарифе — до 5 услуг. ` +
      `На Pro — без ограничений.\n\n` +

      `<b>Что если не разберусь?</b>\n` +
      `Пиши автору, помогу лично: @${SUPPORT_USERNAME}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '✨ Войти в мой салон', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
    return;
  }

  // Любой другой текст — мягкая подсказка
  await sendMessage(chatId,
    `Я помогаю открыть личный салон красоты в Telegram 💅\n\n` +
    `Нажми кнопку ниже чтобы войти в свой салон.\n` +
    `Если есть вопросы — пиши автору: @${SUPPORT_USERNAME}`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '✨ Войти в мой салон', web_app: { url: MINI_APP_URL } }
        ]]
      }
    }
  );
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, bot: 'Beauty_100master_bot' });
  }

  if (req.method === 'POST') {
    try {
      const { message } = req.body || {};
      if (message) await handleMessage(message);
    } catch (err) {
      console.error('Webhook error:', err);
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
