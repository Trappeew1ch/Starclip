// Use relative URL - works both locally (with Vite proxy) and in production
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Get Telegram WebApp init data
function getInitData(): string | null {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        return (window as any).Telegram.WebApp.initData;
    }
    return null;
}

// Get development telegramId from localStorage
function getDevTelegramId(): string | null {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('dev_telegram_id');
    }
    return null;
}

// Generic API request
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const initData = getInitData();
    const devTelegramId = getDevTelegramId();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
    };

    if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
    } else if (devTelegramId) {
        headers['X-Telegram-Id'] = devTelegramId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Auth API
export const authApi = {
    validate: (initData: string) =>
        apiRequest<{ user: any }>('/auth/validate', {
            method: 'POST',
            body: JSON.stringify({ initData })
        }),

    getMe: () => apiRequest<any>('/auth/me')
};

// Offers API
export const offersApi = {
    getAll: (type?: string) =>
        apiRequest<any[]>(`/offers${type ? `?type=${type}` : ''}`),

    getById: (id: string) =>
        apiRequest<any>(`/offers/${id}`),

    join: (id: string) =>
        apiRequest<any>(`/offers/${id}/join`, { method: 'POST' })
};

// Campaigns API
export const campaignsApi = {
    getMy: () => apiRequest<any[]>('/campaigns'),

    getClips: (offerId: string) =>
        apiRequest<any[]>(`/campaigns/${offerId}/clips`)
};

// Clips API
export const clipsApi = {
    getAll: (filters?: { offerId?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.offerId) params.append('offerId', filters.offerId);
        if (filters?.status) params.append('status', filters.status);
        const query = params.toString();
        return apiRequest<any[]>(`/clips${query ? `?${query}` : ''}`);
    },

    submit: (videoUrl: string, offerId: string) =>
        apiRequest<any>('/clips', {
            method: 'POST',
            body: JSON.stringify({ videoUrl, offerId })
        }),

    getById: (id: string) =>
        apiRequest<any>(`/clips/${id}`)
};

// Users API
export const usersApi = {
    getStats: () => apiRequest<any>('/users/stats'),

    getAccounts: () => apiRequest<any[]>('/users/accounts'),

    addAccount: (platform: string, accountName: string, profileUrl?: string) =>
        apiRequest<any>('/users/accounts', {
            method: 'POST',
            body: JSON.stringify({ platform, accountName, profileUrl })
        }),

    withdraw: () => apiRequest<any>('/users/withdraw', { method: 'POST' })
};

// Admin API
export const adminApi = {
    getStats: () => apiRequest<any>('/admin/stats'),

    getUsers: (search?: string, page = 1) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (search) params.append('search', search);
        return apiRequest<any>(`/admin/users?${params}`);
    },

    getUserById: (id: number) => apiRequest<any>(`/admin/users/${id}`),

    getPendingClips: () => apiRequest<any[]>('/admin/clips/pending'),

    approveClip: (id: string, views: number) =>
        apiRequest<any>(`/admin/clips/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ views })
        }),

    rejectClip: (id: string, reason: string) =>
        apiRequest<any>(`/admin/clips/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),

    createOffer: (data: any) =>
        apiRequest<any>('/admin/offers', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    updateOffer: (id: string, data: any) =>
        apiRequest<any>(`/admin/offers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    toggleOffer: (id: string) =>
        apiRequest<any>(`/admin/offers/${id}/toggle`, { method: 'POST' })
};

// Referrals API
export const referralsApi = {
    getInfo: () => apiRequest<any>('/referrals'),
    getList: () => apiRequest<any[]>('/referrals/list')
};

export default {
    auth: authApi,
    offers: offersApi,
    campaigns: campaignsApi,
    clips: clipsApi,
    users: usersApi,
    admin: adminApi,
    referrals: referralsApi
};

