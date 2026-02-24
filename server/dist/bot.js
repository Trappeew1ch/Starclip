import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import { prisma } from './index.js';
let bot = null;
// Generate a unique referral code
function generateReferralCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}
export function initBot() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
        console.error('BOT_TOKEN is not set');
        return;
    }
    bot = new TelegramBot(token, { polling: true });
    const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
    // Production = HTTPS URL, Dev = HTTP or localhost
    const isProduction = webAppUrl.startsWith('https://');
    console.log(`🔧 Bot config: WEBAPP_URL=${webAppUrl}, isProduction=${isProduction}`);
    // Set up Menu Button for Mini App (only in production with HTTPS)
    if (isProduction) {
        bot.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: '🎬 Открыть',
                web_app: { url: webAppUrl }
            }
        }).then(() => {
            console.log('✅ Menu button set to Mini App');
        }).catch((err) => {
            console.error('Failed to set menu button:', err.message);
        });
    }
    const CHANNEL_USERNAME = '@starclip_channel';
    const checkSubscription = async (userId) => {
        try {
            const chatMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
            return ['creator', 'administrator', 'member', 'restricted'].includes(chatMember.status);
        }
        catch (error) {
            console.error('Error checking subscription:', error);
            // If checking fails (e.g. bot not admin in channel), allow access to avoid blocking users
            return true;
        }
    };
    const sendSubscriptionRequest = async (chatId) => {
        try {
            await bot.sendMessage(chatId, `👋 <b>Привет!</b>\n\n` +
                `Для начала работы необходимо подписаться на наш канал: ${CHANNEL_USERNAME}\n\n` +
                `<tg-emoji emoji-id="4915862195104909268">🚀</tg-emoji> Подпишись, и только тогда мы сможем начать работу!\n\n` +
                `После подписки нажми кнопку <b>"Проверить подписку"</b> <tg-emoji emoji-id="4915830502541231852">💰</tg-emoji>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📢 Подписаться на канал', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
                        [{ text: '✅ Проверить подписку', callback_data: 'check_sub' }]
                    ]
                }
            });
        }
        catch (err) {
            console.error('Failed to send subscription request:', err);
        }
    };
    // Callback Query Handler for Subscription Check
    bot.on('callback_query', async (query) => {
        if (query.data === 'check_sub' && query.message) {
            const userId = query.from.id;
            const isSubscribed = await checkSubscription(userId);
            if (isSubscribed) {
                await bot.answerCallbackQuery(query.id, { text: '✅ Подписка подтверждена!' });
                await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                // Trigger start logic manually or ask user to type /start
                await bot.sendMessage(query.message.chat.id, '🎉 Спасибо! Теперь вы можете использовать бота. Нажмите /start');
            }
            else {
                await bot.answerCallbackQuery(query.id, { text: '❌ Вы еще не подписались!', show_alert: true });
            }
        }
    });
    // /start command with optional referral code
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const user = msg.from;
        const startParam = match?.[1]; // e.g., "ref_ABCD1234"
        if (!user)
            return;
        // CHECK SUBSCRIPTION
        const isSubscribed = await checkSubscription(user.id);
        if (!isSubscribed) {
            await sendSubscriptionRequest(chatId);
            return;
        }
        try {
            // Check if this is a referral link
            let referrerId = null;
            if (startParam && startParam.startsWith('ref_')) {
                const referralCode = startParam.replace('ref_', '');
                const referrer = await prisma.user.findUnique({
                    where: { referralCode }
                });
                if (referrer && referrer.telegramId !== BigInt(user.id)) {
                    referrerId = referrer.id;
                    console.log(`User ${user.id} referred by ${referrer.id} (code: ${referralCode})`);
                }
            }
            // Generate a unique verification code
            function generateVerificationCode() {
                return `#SC-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            }
            // ... inside initBot ...
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { telegramId: BigInt(user.id) }
            });
            let dbUser;
            if (existingUser) {
                // Update existing user
                const updateData = {
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                };
                // Backfill verification code if missing
                if (!existingUser.verificationCode) {
                    updateData.verificationCode = generateVerificationCode();
                }
                dbUser = await prisma.user.update({
                    where: { telegramId: BigInt(user.id) },
                    data: updateData
                });
            }
            else {
                // Create new user with optional referrer
                const referralCode = generateReferralCode();
                const verificationCode = generateVerificationCode();
                dbUser = await prisma.user.create({
                    data: {
                        telegramId: BigInt(user.id),
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        referralCode,
                        verificationCode,
                        referredById: referrerId,
                        referredAt: referrerId ? new Date() : null
                    }
                });
                // Notify the referrer about new referral
                if (referrerId) {
                    const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
                    if (referrer) {
                        await bot.sendMessage(Number(referrer.telegramId), `🎉 *Новый реферал!*\n\n` +
                            `${user.first_name || user.username || 'Пользователь'} присоединился по вашей ссылке!\n\n` +
                            `Теперь вы будете получать *10%* с заработка с его нарезок!`, { parse_mode: 'Markdown' }).catch(err => console.error('Failed to notify referrer:', err));
                    }
                }
            }
            console.log(`User registered/updated: @${user.username || user.id} (ID: ${user.id})`);
            if (!isProduction) {
                // Development mode - show info about how to test
                await bot.sendMessage(chatId, `👋 Привет, ${user.first_name}!\n\n` +
                    `Добро пожаловать в *StarClip*!\n\n` +
                    `🔧 *Режим разработки*\n\n` +
                    `Твой Telegram ID: \`${user.id}\`\n\n` +
                    `Для тестирования:\n` +
                    `1. Открой ${webAppUrl} в браузере\n` +
                    `2. В DevTools → Console введи:\n` +
                    `\`localStorage.setItem('dev_telegram_id', '${user.id}')\`\n` +
                    `3. Перезагрузи страницу\n\n` +
                    `Теперь ты будешь авторизован под своим аккаунтом!`, { parse_mode: 'Markdown' });
            }
            else {
                // Production mode - show Mini App button
                await bot.sendMessage(chatId, `👋 Привет, ${user.first_name || 'друг'}!\n\n` +
                    `Добро пожаловать в <b>StarClip</b> — платформу для заработка на клипах блогеров!\n\n` +
                    `<tg-emoji emoji-id="4918422961980966683">✂️</tg-emoji> Создавай нарезки популярных стримеров и ютуберов\n` +
                    `<tg-emoji emoji-id="4915830502541231852">💰</tg-emoji> Получай оплату за просмотры\n` +
                    `<tg-emoji emoji-id="4915862195104909268">🚀</tg-emoji> Выводи заработанное на карту\n` +
                    `<tg-emoji emoji-id="4915834355126896217">➕</tg-emoji> Приводи друзей и получай 10% с заработанных денег с нарезок твоих друзей \n\n\n` +
                    `Твой баланс: <b>${dbUser.balance.toFixed(2)} ₽</b>\n\n` +
                    `Нажми кнопку ниже, чтобы начать!`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                                { text: '🎬 Открыть StarClip', web_app: { url: webAppUrl } }
                            ]]
                    }
                });
            }
        }
        catch (error) {
            console.error('Start command error:', error);
            await bot.sendMessage(chatId, `👋 Привет! Добро пожаловать в StarClip.\n\n` +
                `⚠️ Произошла ошибка. Попробуйте позже.`);
        }
    });
    // /balance command  
    bot.onText(/\/balance/, async (msg) => {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(msg.from.id) }
        });
        if (!user) {
            await bot.sendMessage(msg.chat.id, 'Сначала запустите бота командой /start');
            return;
        }
        await bot.sendMessage(msg.chat.id, `<tg-emoji emoji-id="4915830502541231852">💰</tg-emoji> <b>Ваш баланс:</b> ${user.balance.toFixed(2)} ₽`, { parse_mode: 'HTML' });
    });
    // /help command
    bot.onText(/\/help/, async (msg) => {
        await bot.sendMessage(msg.chat.id, `📖 *Как это работает:*\n\n` +
            `1️⃣ Выберите оффер блогера\n` +
            `2️⃣ Создайте клип-нарезку\n` +
            `3️⃣ Загрузите ссылку на видео\n` +
            `4️⃣ Дождитесь одобрения\n` +
            `5️⃣ Набирайте просмотры и зарабатывайте!\n\n` +
            `❓ Вопросы? Напишите @${process.env.SUPPORT_USERNAME || 'support'}`, { parse_mode: 'Markdown' });
    });
    console.log('Telegram bot initialized');
}
// Send notification to user
export async function sendNotification(telegramId, message, keyboard) {
    if (!bot)
        return;
    try {
        await bot.sendMessage(Number(telegramId), message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
    catch (error) {
        console.error('Failed to send notification:', error);
    }
}
// Notify clip approved
export async function notifyClipApproved(userId, clipTitle, offerName) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return;
    await sendNotification(user.telegramId, `🔥 *Клип одобрен!*\n\n` +
        `📹 "${clipTitle}"\n` +
        `🎯 Оффер: ${offerName}\n\n` +
        `⏳ Статистика прогрузится через 5 дней. Ожидай!\n` +
        `🚀 Отличная работа!`);
}
// Notify clip rejected
export async function notifyClipRejected(userId, clipTitle, reason) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return;
    const supportUsername = process.env.SUPPORT_USERNAME || 'support';
    await sendNotification(user.telegramId, `❌ *Клип отклонён*\n\n` +
        `📹 "${clipTitle}"\n` +
        `📝 Причина: ${reason}\n\n` +
        `Не согласны? Напишите в поддержку.`, {
        inline_keyboard: [[
                { text: '💬 Оспорить', url: `https://t.me/${supportUsername}` }
            ]]
    });
}
export { bot };
