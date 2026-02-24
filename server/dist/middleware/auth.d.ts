import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        telegramId: bigint;
        username: string | null;
        firstName: string | null;
        isAdmin: boolean;
    };
}
export declare function validateInitData(initData: string): {
    valid: boolean;
    data?: Record<string, string>;
};
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
