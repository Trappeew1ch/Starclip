import TelegramBot from 'node-telegram-bot-api';
declare let bot: TelegramBot | null;
export declare function initBot(): void;
export declare function sendNotification(telegramId: bigint, message: string, keyboard?: TelegramBot.InlineKeyboardMarkup): Promise<void>;
export declare function notifyClipApproved(userId: number, clipTitle: string, offerName: string): Promise<void>;
export declare function notifyClipRejected(userId: number, clipTitle: string, reason: string): Promise<void>;
export { bot };
