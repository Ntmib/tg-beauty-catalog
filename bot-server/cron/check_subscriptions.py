"""
Cron-скрипт: проверка истёкших подписок.

Запускается каждую ночь в 02:00 через crontab:
  0 2 * * * /usr/bin/python3 /opt/beauty-bot/cron/check_subscriptions.py

Что делает:
  1. Находит мастеров у кого plan_expires_at + 3 дня < now() → downgrade
  2. Скрывает услуги сверх лимита 5 (is_over_limit = true)
  3. Уведомляет мастеров через их ботов

  4. Отдельно: предупреждает тех у кого подписка истечёт через 3 дня
"""
import os
import sys
import asyncio
import logging
from datetime import datetime, timezone, timedelta

# Добавляем родительскую папку в path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from dotenv import load_dotenv
from crypto import decrypt_token
from telegram_api import send_message, make_inline_keyboard

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

MINI_APP_URL = "https://tg-app-khaki.vercel.app?startapp=admin"
FREE_SERVICE_LIMIT = 5
GRACE_DAYS = 3


async def send_bot_message(master: dict, text: str) -> None:
    """Отправить сообщение мастеру через его бот."""
    if not master.get("bot_token_enc") or not master.get("is_bot_active"):
        return
    try:
        token = decrypt_token(master["bot_token_enc"])
        keyboard = make_inline_keyboard([("⚙️ Продлить подписку", MINI_APP_URL)])
        await send_message(token, master["telegram_id"], text, keyboard)
    except Exception as e:
        logger.error(f"Не удалось отправить мастеру {master['telegram_id']}: {e}")


async def downgrade_master(master: dict) -> None:
    """Перевести мастера на free-план и скрыть лишние услуги."""
    master_id = master["id"]
    logger.info(f"Downgrade мастера {master_id} ({master.get('first_name')})")

    # Обновляем план
    supabase.table("masters").update({
        "plan": "free",
        "plan_expires_at": None,
    }).eq("id", master_id).execute()

    # Получаем активные услуги, отсортированные по sort_order
    services_result = (
        supabase.table("services")
        .select("id, sort_order")
        .eq("master_id", master_id)
        .eq("is_active", True)
        .eq("is_over_limit", False)
        .order("sort_order")
        .execute()
    )
    services = services_result.data or []

    if len(services) > FREE_SERVICE_LIMIT:
        # Скрываем услуги с (FREE_SERVICE_LIMIT+1)-й и дальше
        over_limit_ids = [s["id"] for s in services[FREE_SERVICE_LIMIT:]]
        supabase.table("services").update({
            "is_over_limit": True,
        }).in_("id", over_limit_ids).execute()

        hidden_count = len(over_limit_ids)
        logger.info(f"Скрыто {hidden_count} услуг у мастера {master_id}")

        await send_bot_message(master, (
            f"⚠️ Ваша подписка истекла.\n\n"
            f"<b>{hidden_count} услуг скрыты</b> от клиентов — они не видят их в каталоге.\n\n"
            f"Продлите подписку, чтобы восстановить доступ 👇"
        ))
    else:
        await send_bot_message(master, (
            f"⚠️ Ваша подписка истекла.\n\n"
            f"Вы перешли на бесплатный план (до 5 услуг).\n"
            f"Продлите подписку, чтобы вернуть все возможности 👇"
        ))


async def warn_expiring_soon(master: dict, days_left: int) -> None:
    """Предупредить мастера что подписка скоро истечёт."""
    await send_bot_message(master, (
        f"⏰ Ваша подписка истекает через <b>{days_left} дня</b>.\n\n"
        f"Продлите сейчас, чтобы не потерять доступ к каталогу 👇"
    ))


async def main() -> None:
    now = datetime.now(timezone.utc)

    logger.info("=== check_subscriptions запущен ===")

    # ── 1. Найти истёкшие подписки (с учётом grace period 3 дня) ──
    grace_deadline = now - timedelta(days=GRACE_DAYS)

    expired_result = (
        supabase.table("masters")
        .select("*")
        .neq("plan", "free")
        .lt("plan_expires_at", grace_deadline.isoformat())
        .execute()
    )
    expired_masters = expired_result.data or []
    logger.info(f"Истёкших подписок: {len(expired_masters)}")

    for master in expired_masters:
        await downgrade_master(master)

    # ── 2. Найти тех кто истечёт через 3 дня (предупреждение) ──
    warn_from = now + timedelta(days=2, hours=23)
    warn_to = now + timedelta(days=3, hours=1)

    warning_result = (
        supabase.table("masters")
        .select("*")
        .neq("plan", "free")
        .gte("plan_expires_at", warn_from.isoformat())
        .lte("plan_expires_at", warn_to.isoformat())
        .execute()
    )
    warning_masters = warning_result.data or []
    logger.info(f"Предупреждений (истекает через 3 дня): {len(warning_masters)}")

    for master in warning_masters:
        await warn_expiring_soon(master, 3)

    logger.info("=== check_subscriptions завершён ===")


if __name__ == "__main__":
    asyncio.run(main())
