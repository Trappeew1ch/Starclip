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

    // Initialize Telegram WebApp
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;

        if (tg) {
            tg.ready();
            tg.expand();

            // Authenticate with backend
            if (tg.initData) {
                authApi.validate(tg.initData)
                    .then(({ user }) => {
                        setUser(user);
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        console.error('Auth failed:', err);
                        setError('Authentication failed');
                        setIsLoading(false);
                    });
            } else {
                // Development mode - try to get stored dev user
                const devId = localStorage.getItem('dev_telegram_id');
                if (devId) {
                    authApi.getMe()
                        .then((user) => {
                            setUser(user);
                            setIsLoading(false);
                        })
                        .catch(() => {
                            setIsLoading(false);
                        });
                } else {
                    // Create a dev user for testing
                    localStorage.setItem('dev_telegram_id', '123456789');
                    setIsLoading(false);
                }
            }
        } else {
            // Not in Telegram - development mode
            const devId = localStorage.getItem('dev_telegram_id');
            if (devId) {
                authApi.getMe()
                    .then((user) => {
                        setUser(user);
                        setIsLoading(false);
                    })
                    .catch(() => {
                        // Create test user in dev mode
                        localStorage.setItem('dev_telegram_id', '123456789');
                        setIsLoading(false);
                    });
            } else {
                localStorage.setItem('dev_telegram_id', '123456789');
                setIsLoading(false);
            }
        }
    }, []);

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
