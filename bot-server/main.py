"""
Multi-bot webhook сервер для tg-beauty-catalog SaaS.

Архитектура:
  POST /webhook/bot{bot_id}  — Telegram шлёт сюда события
  POST /notify               — Supabase Edge Function шлёт уведомления мастерам
  GET  /health               — проверка работоспособности

Как это работает:
  1. Мастер подключает своего бота через Mini App
  2. Edge Function вызывает setWebhook → URL = https://api.domain.ru/webhook/bot{bot_id}
  3. Когда клиент пишет мастеру в Telegram, приходит сюда
  4. По bot_id находим мастера в Supabase, расшифровываем токен
  5. Обрабатываем команду и отвечаем через токен этого мастера
"""
import os
import json
import logging
import logging.handlers
import hmac
import hashlib
from pathlib import Path
from aiohttp import web
from supabase import create_client, Client
from dotenv import load_dotenv

from crypto import decrypt_token
from handlers import handle_update
from telegram_api import send_message

load_dotenv()

# ──────────────────────────────────────────────────────────────
# Логирование
# Stdout (journalctl) + два файла: app.log (INFO+) и errors.log (WARNING+)
# Ротация: 5 МБ × 3 файла
# ──────────────────────────────────────────────────────────────

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
LOG_DIR = Path(os.environ.get("LOG_DIR", "/var/log/beauty-bot"))

def _setup_logging() -> logging.Logger:
    log = logging.getLogger("beauty-bot")
    log.setLevel(logging.DEBUG)

    # Stdout (виден в journalctl)
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    stream_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    log.addHandler(stream_handler)

    # Файл: все логи (INFO+)
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / "app.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
        log.addHandler(file_handler)

        # Файл: только ошибки (WARNING+) — для быстрого поиска проблем
        error_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / "errors.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
        )
        error_handler.setLevel(logging.WARNING)
        error_handler.setFormatter(logging.Formatter(LOG_FORMAT))
        log.addHandler(error_handler)

        log.info(f"Файловые логи: {LOG_DIR}/app.log, {LOG_DIR}/errors.log")
    except PermissionError:
        log.warning(f"Нет прав на {LOG_DIR} — пишем только в stdout. Для файловых логов: sudo mkdir -p {LOG_DIR} && sudo chown $USER {LOG_DIR}")

    return log

logger = _setup_logging()

# Supabase клиент (service_role — полный доступ, только на VPS)
supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

VPS_NOTIFY_SECRET = os.environ["VPS_NOTIFY_SECRET"]


# ──────────────────────────────────────────────────────────────
# Вспомогательные функции
# ──────────────────────────────────────────────────────────────

async def get_master_by_bot_id(bot_id: int) -> dict | None:
    """Найти мастера в Supabase по bot_id."""
    result = (
        supabase.table("masters")
        .select("*")
        .eq("bot_id", bot_id)
        .eq("is_bot_active", True)
        .single()
        .execute()
    )
    return result.data


# ──────────────────────────────────────────────────────────────
# Маршруты
# ──────────────────────────────────────────────────────────────

async def handle_webhook(request: web.Request) -> web.Response:
    """
    POST /webhook/bot{bot_id}
    Telegram шлёт сюда все события от бота мастера.
    """
    bot_id_str = request.match_info.get("bot_id")

    try:
        bot_id = int(bot_id_str)
    except (TypeError, ValueError):
        logger.warning(f"Некорректный bot_id: {bot_id_str}")
        return web.Response(status=400, text="Bad bot_id")

    # Парсим тело запроса
    try:
        update = await request.json()
    except Exception:
        return web.Response(status=400, text="Bad JSON")

    logger.info(f"Webhook от bot_id={bot_id}: {list(update.keys())}")

    # Находим мастера по bot_id
    master = await get_master_by_bot_id(bot_id)
    if not master:
        logger.warning(f"Мастер с bot_id={bot_id} не найден")
        # Возвращаем 200 чтобы Telegram не делал retry
        return web.Response(text="ok")

    # Расшифровываем токен
    try:
        token = decrypt_token(master["bot_token_enc"])
    except Exception as e:
        logger.error(f"Ошибка расшифровки токена для bot_id={bot_id}: {e}")
        return web.Response(text="ok")

    # Обрабатываем update
    try:
        await handle_update(update, token, master)
    except Exception as e:
        logger.error(f"Ошибка обработки update: {e}", exc_info=True)

    return web.Response(text="ok")


async def handle_notify(request: web.Request) -> web.Response:
    """
    POST /notify
    Supabase Edge Function шлёт сюда запросы на уведомление мастера.
    Например: новая запись от клиента.

    Авторизация: заголовок X-Notify-Secret = VPS_NOTIFY_SECRET
    """
    # Проверяем секрет
    secret = request.headers.get("X-Notify-Secret", "")
    if not hmac.compare_digest(secret, VPS_NOTIFY_SECRET):
        logger.warning("Неверный X-Notify-Secret в /notify")
        return web.Response(status=403, text="Forbidden")

    try:
        body = await request.json()
    except Exception:
        return web.Response(status=400, text="Bad JSON")

    bot_id = body.get("bot_id")
    telegram_id = body.get("telegram_id")   # кому слать (мастеру)
    message = body.get("message", "")

    if not all([bot_id, telegram_id, message]):
        return web.Response(status=400, text="Missing fields: bot_id, telegram_id, message")

    logger.info(f"Уведомление: bot_id={bot_id} → telegram_id={telegram_id}")

    # Находим мастера
    master = await get_master_by_bot_id(int(bot_id))
    if not master:
        logger.warning(f"Мастер с bot_id={bot_id} не найден для уведомления")
        return web.Response(status=404, text="Master not found")

    # Расшифровываем токен и отправляем
    try:
        token = decrypt_token(master["bot_token_enc"])
        await send_message(token, int(telegram_id), message)
        logger.info(f"Уведомление отправлено мастеру telegram_id={telegram_id}")
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления: {e}", exc_info=True)
        return web.Response(status=500, text="Send failed")

    return web.json_response({"ok": True})


async def handle_health(request: web.Request) -> web.Response:
    """GET /health — проверка что сервер жив."""
    return web.json_response({"ok": True, "service": "beauty-bot-server"})


# ──────────────────────────────────────────────────────────────
# Запуск сервера
# ──────────────────────────────────────────────────────────────

def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/webhook/bot{bot_id}", handle_webhook)
    app.router.add_post("/notify", handle_notify)
    app.router.add_get("/health", handle_health)
    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Запуск beauty-bot-server на порту {port}")
    web.run_app(create_app(), host="0.0.0.0", port=port)
