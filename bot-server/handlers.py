"""
Обработчики команд Telegram-ботов мастеров.

Каждый мастер имеет своего бота. Все боты приходят сюда,
различаем их по bot_id → находим мастера в Supabase.
"""
from telegram_api import send_message, make_inline_keyboard


MINI_APP_BASE_URL = "https://tg-app-khaki.vercel.app"


async def handle_update(update: dict, token: str, master: dict) -> None:
    """Роутер: определяем тип update и вызываем нужный обработчик."""
    message = update.get("message")
    if not message:
        return

    text = message.get("text", "")
    chat_id = message["chat"]["id"]
    user = message.get("from", {})

    # Команды
    if text.startswith("/start"):
        param = text[7:].strip() if len(text) > 7 else ""
        await handle_start(token, chat_id, user, master, param)

    elif text.startswith("/help"):
        await handle_help(token, chat_id, master)

    else:
        await handle_unknown(token, chat_id, master)


async def handle_start(
    token: str,
    chat_id: int,
    user: dict,
    master: dict,
    param: str,
) -> None:
    """
    /start — точка входа.

    Параметры:
      (пусто)    → обычный клиент, открываем каталог
      from_app   → клиент пришёл с оффера, даём промокод
      admin      → мастер открывает своё приложение
    """
    master_telegram_id = master.get("telegram_id")
    user_telegram_id = user.get("id")
    master_name = master.get("first_name", "мастера")

    # Мастер зашёл в своего бота
    if user_telegram_id == master_telegram_id:
        await _start_master(token, chat_id, master)
        return

    # Клиент с промокодом (пришёл с оффера скидки 15%)
    if param == "from_app":
        await _start_client_promo(token, chat_id, user, master)
        return

    # Обычный клиент
    await _start_client(token, chat_id, user, master)


async def _start_client(token: str, chat_id: int, user: dict, master: dict) -> None:
    name = user.get("first_name", "")
    master_name = master.get("first_name", "мастера")
    bot_username = master.get("bot_username", "")
    mini_app_url = f"{MINI_APP_BASE_URL}?master={master.get('id', '')}"

    text = (
        f"Привет, {name}! 👋\n\n"
        f"Это каталог {master_name}.\n\n"
        f"Здесь ты можешь:\n"
        f"• посмотреть услуги и цены\n"
        f"• записаться онлайн\n"
        f"• получить напоминание о записи"
    )
    keyboard = make_inline_keyboard([
        ("💅 Открыть каталог", mini_app_url),
    ])
    await send_message(token, chat_id, text, keyboard)


async def _start_client_promo(token: str, chat_id: int, user: dict, master: dict) -> None:
    name = user.get("first_name", "")
    mini_app_url = f"{MINI_APP_BASE_URL}?master={master.get('id', '')}"

    text = (
        f"🎁 {name}, держи промокод на первую запись!\n\n"
        f"<b>BEAUTY15</b> — скидка 15%\n\n"
        f"Покажи этот промокод мастеру при записи."
    )
    keyboard = make_inline_keyboard([
        ("💅 Записаться со скидкой", mini_app_url),
    ])
    await send_message(token, chat_id, text, keyboard)


async def _start_master(token: str, chat_id: int, master: dict) -> None:
    name = master.get("first_name", "")
    mini_app_url = f"{MINI_APP_BASE_URL}?master={master.get('id', '')}"

    text = (
        f"Привет, {name}! 👩‍💼\n\n"
        f"Это панель управления твоим каталогом.\n\n"
        f"Открой приложение чтобы:\n"
        f"• управлять услугами и расписанием\n"
        f"• смотреть записи клиентов\n"
        f"• настроить профиль"
    )
    keyboard = make_inline_keyboard([
        ("⚙️ Открыть управление", mini_app_url),
    ])
    await send_message(token, chat_id, text, keyboard)


async def handle_help(token: str, chat_id: int, master: dict) -> None:
    master_name = master.get("first_name", "мастера")
    bot_username = master.get("bot_username", "")
    mini_app_url = f"{MINI_APP_BASE_URL}?master={master.get('id', '')}"

    text = (
        f"ℹ️ Каталог {master_name}\n\n"
        f"<b>Команды:</b>\n"
        f"/start — открыть каталог\n"
        f"/help — эта справка\n\n"
        f"Для записи нажми кнопку ниже 👇"
    )
    keyboard = make_inline_keyboard([
        ("💅 Открыть каталог", mini_app_url),
    ])
    await send_message(token, chat_id, text, keyboard)


async def handle_unknown(token: str, chat_id: int, master: dict) -> None:
    mini_app_url = f"{MINI_APP_BASE_URL}?master={master.get('id', '')}"

    text = "Для записи используй каталог 👇"
    keyboard = make_inline_keyboard([
        ("💅 Открыть каталог", mini_app_url),
    ])
    await send_message(token, chat_id, text, keyboard)
