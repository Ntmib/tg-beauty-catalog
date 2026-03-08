"""
Обёртка для вызовов Telegram Bot API
"""
import aiohttp


async def send_message(token: str, chat_id: int, text: str, reply_markup: dict = None) -> dict:
    """Отправить сообщение через бота."""
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json=payload,
        ) as resp:
            return await resp.json()


def make_inline_keyboard(buttons: list[tuple[str, str]]) -> dict:
    """Создать inline-клавиатуру из списка (текст, web_app_url)."""
    return {
        "inline_keyboard": [
            [{"text": text, "web_app": {"url": url}}]
            for text, url in buttons
        ]
    }
