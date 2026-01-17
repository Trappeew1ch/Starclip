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

    // For development, allow bypass with telegramId header
    if (process.env.NODE_ENV === 'development' && req.headers['x-telegram-id']) {
        const telegramId = BigInt(req.headers['x-telegram-id'] as string);
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

// Admin middleware
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
