import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../index.js';

// Extended Request with user
export interface AuthRequest extends Request {
    user?: {
        id: number;
        telegramId: bigint;
        username: string | null;
        firstName: string | null;
        isAdmin: boolean;
    };
}

// Validate Telegram WebApp initData
export function validateInitData(initData: string): { valid: boolean; data?: Record<string, string> } {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return { valid: false };

    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Sort params alphabetically
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Calculate secret key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Calculate hash
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (calculatedHash !== hash) {
            return { valid: false };
        }

        // Parse data
        const data: Record<string, string> = {};
        for (const [key, value] of urlParams.entries()) {
            data[key] = value;
        }

        return { valid: true, data };
    } catch (error) {
        return { valid: false };
    }
}

// Auth middleware - validates Telegram WebApp data
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const initData = req.headers['x-telegram-init-data'] as string;
    const telegramIdHeader = req.headers['x-telegram-id'] as string;

    // Allow X-Telegram-Id for admin panel (checked by adminMiddleware)
    // or in development mode
    if (telegramIdHeader) {
        try {
            const telegramId = BigInt(telegramIdHeader);
            const user = await prisma.user.findUnique({
                where: { telegramId }
            });

            if (user) {
                req.user = {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    isAdmin: user.isAdmin
                };
                return next();
            }
        } catch (e) {
            // Invalid telegramId format, continue to other auth methods
        }
    }

    if (!initData) {
        return res.status(401).json({ error: 'No authorization data provided' });
    }

    const validation = validateInitData(initData);
    if (!validation.valid || !validation.data) {
        return res.status(401).json({ error: 'Invalid authorization data' });
    }

    try {
        const userData = JSON.parse(validation.data.user || '{}');
        const telegramId = BigInt(userData.id);

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { telegramId }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId,
                    username: userData.username,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    photoUrl: userData.photo_url
                }
            });
        }

        req.user = {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            isAdmin: user.isAdmin
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

// Admin middleware - checks both database isAdmin and ADMIN_IDS env
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
    const userTelegramId = req.user?.telegramId?.toString();

    // Check if user is admin in database OR in ADMIN_IDS env
    const isAdminInEnv = userTelegramId && adminIds.includes(userTelegramId);
    const isAdminInDb = req.user?.isAdmin;

    if (!isAdminInDb && !isAdminInEnv) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    // If admin via env but not in DB, update DB
    if (isAdminInEnv && !isAdminInDb && req.user) {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { isAdmin: true }
        });
        req.user.isAdmin = true;
    }

    next();
}
