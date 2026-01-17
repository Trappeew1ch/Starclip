# StarClip - Деплой на Timeweb VPS

## Информация о сервере
- **IP**: 147.45.235.25
- **Домен**: starclip.site
- **ОС**: Ubuntu
- **SSH**: `ssh root@147.45.235.25`

---

## Шаг 1: DNS записи в reg.ru

Зайди на reg.ru → Мои домены → starclip.site → DNS-серверы и записи

Добавь записи:
```
Тип: A    Subdomain: @      Значение: 147.45.235.25
Тип: A    Subdomain: www    Значение: 147.45.235.25
```

⏳ Подожди 10-30 минут пока DNS обновится.

---

## Шаг 2: Подготовка сервера (по SSH)

```bash
# Подключись к серверу
ssh root@147.45.235.25

# Обнови систему
apt update && apt upgrade -y

# Установи Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверь версию
node -v  # Должно быть v20.x.x
npm -v

# Установи PM2 глобально
npm install -g pm2

# Установи Nginx
apt install -y nginx

# Установи Certbot для SSL
apt install -y certbot python3-certbot-nginx

# Создай директорию для проекта
mkdir -p /var/www/starclip
```

---

## Шаг 3: Сборка проекта (на твоём PC)

```powershell
# В папке проекта StarClip
cd D:\PROJECTSSS\StarClip

# Сборка frontend
npm run build

# Сборка backend
cd server
npm run build
cd ..
```

---

## Шаг 4: Загрузка на сервер (с твоего PC)

```powershell
# Загрузи frontend (dist)
scp -r dist/* root@147.45.235.25:/var/www/starclip/

# Создай папку server на сервере
ssh root@147.45.235.25 "mkdir -p /var/www/starclip/server"

# Загрузи backend
scp -r server/dist root@147.45.235.25:/var/www/starclip/server/
scp -r server/prisma root@147.45.235.25:/var/www/starclip/server/
scp server/package.json root@147.45.235.25:/var/www/starclip/server/

# Загрузи PM2 конфиг
scp ecosystem.config.js root@147.45.235.25:/var/www/starclip/
```

---

## Шаг 5: Настройка на сервере

```bash
# Подключись к серверу
ssh root@147.45.235.25

# Перейди в папку
cd /var/www/starclip/server

# Установи зависимости (только production)
npm install --omit=dev

# Сгенерируй Prisma client
npx prisma generate

# Создай базу данных
npx prisma db push

# Создай .env файл
nano .env
```

**Содержимое .env:**
```
BOT_TOKEN=ТВОЙ_ТОКЕН_ОТ_BOTFATHER
WEBAPP_URL=https://starclip.site
SUPPORT_USERNAME=твой_support_username
ADMIN_IDS=твой_telegram_id
NODE_ENV=production
PORT=3001
```

Сохрани: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Шаг 6: Настройка Nginx

```bash
# Создай конфиг для сайта
nano /etc/nginx/sites-available/starclip
```

**Содержимое:**
```nginx
server {
    listen 80;
    server_name starclip.site www.starclip.site;

    # Frontend
    root /var/www/starclip;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /admin {
        try_files $uri $uri/ /admin/index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Включи сайт
ln -s /etc/nginx/sites-available/starclip /etc/nginx/sites-enabled/

# Удали default (опционально)
rm /etc/nginx/sites-enabled/default

# Проверь конфиг
nginx -t

# Перезапусти Nginx
systemctl reload nginx
```

---

## Шаг 7: SSL сертификат

```bash
certbot --nginx -d starclip.site -d www.starclip.site
```

Введи email, согласись с условиями. Certbot автоматически настроит HTTPS!

---

## Шаг 8: Запуск приложения

```bash
cd /var/www/starclip

# Запусти через PM2
pm2 start ecosystem.config.js --env production

# Проверь статус
pm2 status

# Посмотри логи
pm2 logs starclip-api

# Сохрани конфиг PM2
pm2 save

# Настрой автозапуск
pm2 startup
```

---

## Шаг 9: Заполни базу тестовыми данными

```bash
cd /var/www/starclip/server
npx tsx prisma/seed.ts  # или node dist/seed.js
```

---

## Шаг 10: Настройка бота в @BotFather

1. Открой @BotFather в Telegram
2. /mybots → выбери своего бота
3. Bot Settings → Menu Button → Configure menu button
4. Отправь: `https://starclip.site`
5. Отправь текст кнопки: `🎬 Открыть`

---

## ✅ Готово!

Проверь:
- https://starclip.site - должен открыться Mini App
- https://starclip.site/admin/ - админ панель
- https://starclip.site/api/health - API должен ответить `{"status":"ok"}`
- В Telegram боте должна появиться кнопка "🎬 Открыть"

---

## Полезные команды

```bash
# Перезапуск приложения
pm2 restart starclip-api

# Логи
pm2 logs starclip-api --lines 100

# Статус
pm2 status

# Остановка
pm2 stop starclip-api
```
