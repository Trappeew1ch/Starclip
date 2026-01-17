# StarClip - Telegram Mini App

Платформа монетизации клипов для блогеров. Пользователи создают нарезки видео популярных стримеров и ютуберов, и получают оплату за просмотры.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Настройка базы данных

```bash
cd server
npx prisma generate
npx prisma db push
```

### 3. Заполнение тестовыми данными

```bash
cd server
npx tsx src/seed.ts
```

### 4. Настройка окружения

Создайте файл `server/.env`:
```
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
SUPPORT_USERNAME=your_support_username
WEBAPP_URL=http://localhost:5173
ADMIN_IDS=your_telegram_id
NODE_ENV=development
```

### 5. Запуск

```bash
# Терминал 1 - Backend
cd server
npm run dev

# Терминал 2 - Frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin/
- **Backend API**: http://localhost:3001

## 📁 Структура проекта

```
StarClip/
├── server/                 # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── bot.ts          # Telegram bot
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth middleware
│   └── prisma/
│       └── schema.prisma   # Database schema
├── components/             # React components
├── admin/                  # Admin panel
├── api.ts                  # API client
├── context.tsx             # React context
└── App.tsx                 # Main app
```

## 🔧 API Endpoints

### Auth
- `POST /api/auth/validate` - Validate Telegram initData
- `GET /api/auth/me` - Get current user

### Offers
- `GET /api/offers` - List offers
- `GET /api/offers/:id` - Get offer details
- `POST /api/offers/:id/join` - Join campaign

### Campaigns
- `GET /api/campaigns` - User's campaigns
- `GET /api/campaigns/:id/clips` - Campaign clips

### Clips
- `GET /api/clips` - User's clips
- `POST /api/clips` - Submit new clip
- `GET /api/clips/:id` - Clip details

### Users
- `GET /api/users/stats` - User statistics
- `GET /api/users/accounts` - Social accounts
- `POST /api/users/accounts` - Add account
- `POST /api/users/withdraw` - Request withdrawal

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - User list
- `GET /api/admin/users/:id` - User details
- `GET /api/admin/clips/pending` - Pending clips
- `POST /api/admin/clips/:id/approve` - Approve clip
- `POST /api/admin/clips/:id/reject` - Reject clip
- `POST /api/admin/offers` - Create offer
- `PUT /api/admin/offers/:id` - Update offer
- `POST /api/admin/offers/:id/toggle` - Toggle offer

## 🤖 Telegram Bot Commands

- `/start` - Launch Mini App
- `/balance` - Check balance
- `/help` - How it works

## 📝 TODO

- [ ] Implement video stats parser (Puppeteer)
- [ ] Schedule stats update cron job
- [ ] Add offer creation form UI
- [ ] Production deployment
