import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, offersApi, campaignsApi, usersApi } from './services';

interface User {
    id: number;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    balance: number;
    isAdmin: boolean;
}

interface AppContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Actions
    refreshUser: () => Promise<void>;

    // Data
    offers: any[];
    campaigns: any[];
    stats: any | null;

    // Data loaders
    loadOffers: (type?: string) => Promise<void>;
    loadCampaigns: () => Promise<void>;
    loadStats: () => Promise<void>;

    // Campaign actions
    joinCampaign: (offerId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [offers, setOffers] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [stats, setStats] = useState<any | null>(null);

    // Check if running in production (not localhost)
    const isProduction = typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1');

    // Initialize Telegram WebApp
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;

        if (tg && tg.initData) {
            // Opened from Telegram Mini App - authenticate with initData
            tg.ready();
            tg.expand();

            authApi.validate(tg.initData)
                .then(({ user }) => {
                    setUser(user);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Auth failed:', err);
                    setError('Ошибка авторизации. Попробуйте перезапустить приложение.');
                    setIsLoading(false);
                });
        } else if (isProduction) {
            // Production but NOT opened from Telegram - BLOCK ACCESS
            setError('Откройте приложение через Telegram бота @StarClipBot');
            setIsLoading(false);
        } else {
            // Development mode - allow dev login
            const devId = localStorage.getItem('dev_telegram_id');
            if (devId) {
                authApi.getMe()
                    .then((user) => {
                        setUser(user);
                        setIsLoading(false);
                    })
                    .catch(() => {
                        setError('Dev user not found. Run /start in bot first.');
                        setIsLoading(false);
                    });
            } else {
                setError('Set dev_telegram_id in localStorage. Run /start in bot to get your ID.');
                setIsLoading(false);
            }
        }
    }, [isProduction]);

    const refreshUser = async () => {
        try {
            const userData = await authApi.getMe();
            setUser(userData);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    const loadOffers = async (type?: string) => {
        try {
            const data = await offersApi.getAll(type);
            setOffers(data);
        } catch (err) {
            console.error('Failed to load offers:', err);
        }
    };

    const loadCampaigns = async () => {
        try {
            const data = await campaignsApi.getMy();
            setCampaigns(data);
        } catch (err) {
            console.error('Failed to load campaigns:', err);
        }
    };

    const loadStats = async () => {
        try {
            const data = await usersApi.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const joinCampaign = async (offerId: string): Promise<boolean> => {
        try {
            await offersApi.join(offerId);
            await loadCampaigns();
            return true;
        } catch (err: any) {
            console.error('Failed to join campaign:', err);
            // If already joined, still return success
            if (err.message?.includes('Already joined')) {
                return true;
            }
            return false;
        }
    };

    const value: AppContextType = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        refreshUser,
        offers,
        campaigns,
        stats,
        loadOffers,
        loadCampaigns,
        loadStats,
        joinCampaign
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
