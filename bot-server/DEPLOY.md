# Деплой бота на Beget VPS

## Что потребуется
- VPS на Beget (Ubuntu 22.04)
- Купленный домен с A-записью → 193.42.124.57
- SSH доступ к серверу

---

## Шаг 1: Подключиться к VPS

```bash
ssh root@193.42.124.57
```

---

## Шаг 2: Установить зависимости

```bash
apt update && apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

---

## Шаг 3: Скопировать файлы на сервер

На твоём Mac (в терминале VSCode):

```bash
# Создаём папку на сервере
ssh root@193.42.124.57 "mkdir -p /opt/beauty-bot/cron"

# Копируем файлы
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/main.py        root@193.42.124.57:/opt/beauty-bot/
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/handlers.py    root@193.42.124.57:/opt/beauty-bot/
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/crypto.py      root@193.42.124.57:/opt/beauty-bot/
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/telegram_api.py root@193.42.124.57:/opt/beauty-bot/
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/requirements.txt root@193.42.124.57:/opt/beauty-bot/
scp /Users/macbookledovskih/Documents/Projects/tg-beauty-catalog/bot-server/cron/check_subscriptions.py root@193.42.124.57:/opt/beauty-bot/cron/
```

---

## Шаг 4: Создать виртуальное окружение и установить пакеты

```bash
ssh root@193.42.124.57

cd /opt/beauty-bot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Шаг 5: Создать .env файл на сервере

```bash
nano /opt/beauty-bot/.env
```

Вставить (заменить значения на реальные):

```
SUPABASE_URL=https://zbxbeagmqmnijkjhhcgp.supabase.co
SUPABASE_SERVICE_KEY=eyJ...твой_service_role_ключ...
TOKEN_ENCRYPTION_KEY=сгенерируй_32_байта_hex_ниже
VPS_NOTIFY_SECRET=придумай_любую_строку_минимум_32_символа
PORT=8080
```

Сгенерировать TOKEN_ENCRYPTION_KEY:
```bash
python3 -c "import os; print(os.urandom(32).hex())"
```

Сохранить: Ctrl+O → Enter → Ctrl+X

---

## Шаг 6: Настроить nginx

```bash
nano /etc/nginx/sites-available/beauty-api
```

Вставить (заменить ВАШ_ДОМЕН на реальный, например api.beauty-master.ru):

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Активировать и проверить:
```bash
ln -s /etc/nginx/sites-available/beauty-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Шаг 7: Получить SSL сертификат

```bash
certbot --nginx -d ВАШ_ДОМЕН
```

Certbot спросит email (введи любой) и согласие с правилами (Y).
После этого nginx будет работать на HTTPS автоматически.

Проверить:
```bash
curl https://ВАШ_ДОМЕН/health
# Должно вернуть: {"ok": true, "service": "beauty-bot-server"}
```

---

## Шаг 8: Настроить systemd (автозапуск)

```bash
cp /opt/beauty-bot/beauty-bot.service /etc/systemd/system/  # Если файл был скопирован
# Или создать вручную:
nano /etc/systemd/system/beauty-bot.service
```

Содержимое файла `beauty-bot.service` уже готово в репозитории.

```bash
systemctl daemon-reload
systemctl enable beauty-bot
systemctl start beauty-bot
systemctl status beauty-bot   # Должно показать: active (running)
```

---

## Шаг 9: Настроить cron

```bash
crontab -e
```

Добавить в конец:
```
0 2 * * * /opt/beauty-bot/venv/bin/python3 /opt/beauty-bot/cron/check_subscriptions.py >> /var/log/beauty-cron.log 2>&1
```

Сохранить: Ctrl+O → Enter → Ctrl+X

---

## Шаг 10: Финальная проверка

```bash
# Сервер жив?
curl https://ВАШ_ДОМЕН/health

# Логи сервера
journalctl -u beauty-bot -f

# Тест /notify endpoint (заменить YOUR_NOTIFY_SECRET)
curl -X POST https://ВАШ_ДОМЕН/notify \
  -H "Content-Type: application/json" \
  -H "X-Notify-Secret: YOUR_NOTIFY_SECRET" \
  -d '{"bot_id": 999, "telegram_id": 123, "message": "test"}'
# Вернёт 404 (мастер не найден) — это нормально, значит сервер работает
```

---

## Обновление кода

При изменениях — скопировать новые файлы и перезапустить:

```bash
# С Mac:
scp bot-server/main.py root@193.42.124.57:/opt/beauty-bot/

# На сервере:
systemctl restart beauty-bot
```
