export declare function calculateEarnings(views: number, cpmRate: number): number;
export declare function processClipPayment(clipId: string, views: number): Promise<{
    clipId: string;
    views: number;
    earnedAmount: number;
    newBalance: number | undefined;
}>;
export declare function getUserTransactions(userId: number, limit?: number): Promise<{
    id: number;
    createdAt: Date;
    userId: number;
    type: string;
    status: string;
    clipId: string | null;
    amount: number;
}[]>;
export declare function getUserTotalEarnings(userId: number): Promise<number>;
