# ERRORS — Журнал ошибок

Файл для быстрой фиксации ошибок во время разработки и в продакшене.

**Как использовать:**
1. Нашёл ошибку → сразу записал в "Активные ошибки"
2. Разобрался → перенёс в "Решённые" с объяснением фикса
3. Часто повторяется → добавил в "Справочник типовых ошибок"

---

## Активные ошибки

<!-- Копируй шаблон ниже для каждой новой ошибки -->

<!--
### [КОМПОНЕНТ] Краткое описание ошибки
**Дата:** ГГГГ-ММ-ДД
**Компонент:** bot-server | tg-app | supabase | vercel | other
**Серьёзность:** critical | high | medium | low
**Текст ошибки:**
```
вставь текст ошибки из терминала/журнала
```
**Как воспроизвести:**
1.
2.
**Где смотреть логи:**
- VPS: `journalctl -u beauty-bot -n 100 --no-pager`
- Vercel: Dashboard → Logs
**Статус:** в работе | заблокирован
-->

---

## Решённые ошибки

<!-- Переноси сюда после фикса с объяснением -->

---

## Справочник типовых ошибок

Быстрый поиск по симптому → причина → лечение.

### bot-server (Python, VPS)

| Симптом | Причина | Команда диагностики | Фикс |
|---------|---------|--------------------|----|
| Сервис не запускается | Ошибка в .env | `journalctl -u beauty-bot -n 50` | Проверить `.env`, все ключи заполнены |
| `KeyError: 'SUPABASE_URL'` | Переменная не загружена | `systemctl cat beauty-bot` | Добавить `EnvironmentFile=/home/user/bot-server/.env` в service |
| Webhook не получает апдейты | Telegram не видит URL | `curl https://api.domain.ru/health` | Проверить nginx, SSL, setWebhook через BotFather |
| `decrypt_token` — ошибка | Неверный `TOKEN_ENCRYPTION_KEY` | Логи: `grep "расшифровки" /var/log/beauty-bot/errors.log` | Сгенерировать новый ключ, пересохранить токены |
| 403 на `/notify` | Неверный `VPS_NOTIFY_SECRET` | Логи Edge Function в Supabase Dashboard | Синхронизировать секрет в .env VPS и Supabase |
| `supabase.table()` зависает | Rate limit или нет сети | `ping supabase.co` | Проверить Supabase Dashboard, добавить retry |

### tg-app (Vanilla JS, Vercel)

| Симптом | Причина | Где смотреть | Фикс |
|---------|---------|-------------|------|
| Белый экран | JS ошибка при загрузке | DevTools → Console | Открыть ошибку, найти строку в `js/app.js` |
| Экран не переходит | Имя экрана не зарегистрировано | Console: `router.screens` | Добавить регистрацию в `app.js` |
| Telegram кнопки не работают | Контекст не в Telegram | Console: `window.Telegram` | Открывать только через Mini App |
| Webhook бота не отвечает | Vercel cold start или ошибка | Vercel Dashboard → Functions Logs | Проверить `api/webhook.js`, переменную `BOT_TOKEN` |

### Supabase

| Симптом | Причина | Команда диагностики | Фикс |
|---------|---------|--------------------|----|
| `PGRST116` — row not found | RLS блокирует SELECT | Dashboard → Auth → RLS Policies | Проверить/добавить политику для роли |
| `23505` — duplicate key | Запись уже есть | Логи миграции | Добавить `ON CONFLICT DO NOTHING` или проверить перед вставкой |
| Edge Function 500 | Ошибка в JS коде | Dashboard → Edge Functions → Logs | Открыть логи, найти строку ошибки |
| Storage upload 403 | Политика bucket | Dashboard → Storage → Policies | Добавить INSERT политику для authenticated |

---

## Логи — шпаргалка команд

```bash
# === VPS (Beget, 193.42.124.57) ===
ssh user@193.42.124.57

# Статус сервиса
systemctl status beauty-bot

# Логи в реальном времени
journalctl -u beauty-bot -f

# Последние 100 строк
journalctl -u beauty-bot -n 100 --no-pager

# Только ошибки за сегодня
journalctl -u beauty-bot --since today -p err

# Файл ошибок (если настроен RotatingFileHandler)
tail -f /var/log/beauty-bot/errors.log
grep "ERROR" /var/log/beauty-bot/errors.log | tail -50

# Файл всех логов
tail -f /var/log/beauty-bot/app.log

# Логи cron-задачи
cat /var/log/beauty-cron.log
tail -f /var/log/beauty-cron.log


# === Проверка health ===
curl https://api.yourdomain.ru/health

# === Vercel (локально) ===
cd tg-app && vercel logs --follow

# === Локальный запуск для дебага ===
cd bot-server
python3 main.py
# Смотреть вывод прямо в терминале
```

---

## Переменные окружения — чеклист

Если что-то не работает — сначала проверь .env на VPS:

```bash
# На VPS:
cat /home/user/bot-server/.env

# Должны быть все эти переменные:
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
TOKEN_ENCRYPTION_KEY=...  # 32 байта base64
VPS_NOTIFY_SECRET=...
PORT=8080
```

Переменные Vercel:
```bash
# В tg-app/.env или Vercel Dashboard:
BOT_TOKEN=...  # Токен @Beauty_100master_bot
```
