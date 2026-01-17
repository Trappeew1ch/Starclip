import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Users, Film, DollarSign, Clock, Check, X, Plus, ChevronRight, RefreshCw, Youtube, Instagram, Music2, LogIn, Shield, Image, Upload } from 'lucide-react';

// Use relative URL so it works both locally and in production
const API_URL = '/api';

// Get admin auth from localStorage
function getAdminAuth(): { telegramId: string; token: string } | null {
    const auth = localStorage.getItem('admin_auth');
    return auth ? JSON.parse(auth) : null;
}

function setAdminAuth(telegramId: string, token: string) {
    localStorage.setItem('admin_auth', JSON.stringify({ telegramId, token }));
}

function clearAdminAuth() {
    localStorage.removeItem('admin_auth');
}

// API request with admin auth
async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const auth = getAdminAuth();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
    };

    if (auth) {
        headers['X-Telegram-Id'] = auth.telegramId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        clearAdminAuth();
        window.location.reload();
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Types
interface DashboardStats {
    totalUsers: number;
    activeOffers: number;
    pendingClips: number;
    totalClips: number;
    totalPaidOut: number;
}

interface PendingClip {
    id: string;
    videoUrl: string;
    platform: string;
    createdAt: string;
    user: { id: number; username: string; firstName: string };
    offer: { id: string; name: string; title: string; cpmRate: number };
}

// Admin Login Component
function AdminLogin({ onLogin }: { onLogin: (id: string) => void }) {
    const [telegramId, setTelegramId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telegramId) return;

        setIsLoading(true);
        setError('');

        try {
            // Verify admin status
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Id': telegramId
                }
            });

            if (response.ok) {
                setAdminAuth(telegramId, 'dev-token');
                onLogin(telegramId);
            } else if (response.status === 403) {
                setError('Доступ запрещён. Вы не являетесь администратором.');
            } else {
                setError('Ошибка авторизации');
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">StarClip Admin</h1>
                    <p className="text-zinc-500">Вход в панель администратора</p>
                </div>

                <form onSubmit={handleLogin} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Telegram ID
                        </label>
                        <input
                            type="text"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            placeholder="Введите ваш Telegram ID"
                            className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                        />
                        <p className="text-xs text-zinc-600 mt-2">
                            Узнать ID можно у @userinfobot в Telegram
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!telegramId || isLoading}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <RefreshCw className="animate-spin" size={18} />
                        ) : (
                            <>
                                <LogIn size={18} />
                                Войти
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-zinc-600 text-xs mt-4">
                    Доступ только для администраторов, указанных в ADMIN_IDS
                </p>
            </div>
        </div>
    );
}

// Main Admin Panel
function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'clips' | 'users' | 'offers'>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingClips, setPendingClips] = useState<PendingClip[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Modal states
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [approveModal, setApproveModal] = useState<{ clip: PendingClip; views: string } | null>(null);
    const [rejectModal, setRejectModal] = useState<{ clip: PendingClip; reason: string } | null>(null);

    // Offer form state
    const [offerForm, setOfferForm] = useState({
        name: '',
        title: '',
        type: 'STREAMER',
        imageUrl: '',
        avatarUrl: '',
        bannerUrl: '',
        totalBudget: '',
        cpmRate: '',
        language: 'Russian',
        platforms: ['youtube', 'tiktok', 'instagram'],
        description: '',
        requirements: '',
        assetsLink: '',
        daysLeft: '30'
    });

    // Check auth on mount
    useEffect(() => {
        const auth = getAdminAuth();
        if (auth) {
            // Verify auth is still valid
            adminRequest('/admin/stats')
                .then(() => setIsAuthenticated(true))
                .catch(() => {
                    clearAdminAuth();
                    setIsAuthenticated(false);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [activeTab, isAuthenticated]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const [statsData, clipsData] = await Promise.all([
                    adminRequest<DashboardStats>('/admin/stats'),
                    adminRequest<PendingClip[]>('/admin/clips/pending')
                ]);
                setStats(statsData);
                setPendingClips(clipsData.slice(0, 5));
            } else if (activeTab === 'clips') {
                const clipsData = await adminRequest<PendingClip[]>('/admin/clips/pending');
                setPendingClips(clipsData);
            } else if (activeTab === 'users') {
                const params = new URLSearchParams({ page: '1' });
                if (searchQuery) params.append('search', searchQuery);
                const usersData = await adminRequest<any>(`/admin/users?${params}`);
                setUsers(usersData.users);
            } else if (activeTab === 'offers') {
                const offersData = await adminRequest<any[]>('/offers');
                setOffers(offersData);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveModal) return;
        try {
            await adminRequest(`/admin/clips/${approveModal.clip.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ views: parseInt(approveModal.views) || 0 })
            });
            setPendingClips(pendingClips.filter(c => c.id !== approveModal.clip.id));
            setApproveModal(null);
            // Update stats
            if (stats) {
                setStats({ ...stats, pendingClips: stats.pendingClips - 1 });
            }
        } catch (error: any) {
            alert(error.message || 'Ошибка при одобрении');
        }
    };

    const handleReject = async () => {
        if (!rejectModal || !rejectModal.reason.trim()) return;
        try {
            await adminRequest(`/admin/clips/${rejectModal.clip.id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectModal.reason })
            });
            setPendingClips(pendingClips.filter(c => c.id !== rejectModal.clip.id));
            setRejectModal(null);
            if (stats) {
                setStats({ ...stats, pendingClips: stats.pendingClips - 1 });
            }
        } catch (error: any) {
            alert(error.message || 'Ошибка при отклонении');
        }
    };

    const handleCreateOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminRequest('/admin/offers', {
                method: 'POST',
                body: JSON.stringify({
                    ...offerForm,
                    totalBudget: parseFloat(offerForm.totalBudget),
                    cpmRate: parseFloat(offerForm.cpmRate),
                    daysLeft: parseInt(offerForm.daysLeft),
                    requirements: offerForm.requirements.split('\n').filter(r => r.trim())
                })
            });
            setShowOfferForm(false);
            setOfferForm({
                name: '', title: '', type: 'STREAMER', imageUrl: '', avatarUrl: '', bannerUrl: '',
                totalBudget: '', cpmRate: '', language: 'Russian', platforms: ['youtube', 'tiktok', 'instagram'],
                description: '', requirements: '', assetsLink: '', daysLeft: '30'
            });
            loadData();
        } catch (error: any) {
            alert(error.message || 'Ошибка при создании оффера');
        }
    };

    const handleUserClick = async (userId: number) => {
        try {
            const userData = await adminRequest<any>(`/admin/users/${userId}`);
            setSelectedUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const handleToggleOffer = async (offerId: string) => {
        try {
            await adminRequest(`/admin/offers/${offerId}/toggle`, { method: 'POST' });
            loadData();
        } catch (error) {
            console.error('Failed to toggle offer:', error);
        }
    };

    const handleLogout = () => {
        clearAdminAuth();
        setIsAuthenticated(false);
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return <Youtube size={16} className="text-red-500" />;
            case 'instagram': return <Instagram size={16} className="text-pink-500" />;
            case 'tiktok': return <Music2 size={16} className="text-cyan-400" />;
            default: return null;
        }
    };

    // Show loading
    if (isLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    // Show login
    if (!isAuthenticated) {
        return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        StarClip Admin
                    </h1>
                    <div className="flex items-center gap-4">
                        <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white">
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 flex gap-6">
                {/* Sidebar */}
                <nav className="w-56 flex-shrink-0">
                    <div className="sticky top-20 space-y-1">
                        {[
                            { id: 'dashboard', icon: DollarSign, label: 'Дашборд' },
                            { id: 'clips', icon: Clock, label: 'Модерация', badge: stats?.pendingClips },
                            { id: 'users', icon: Users, label: 'Пользователи' },
                            { id: 'offers', icon: Film, label: 'Офферы' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span className="font-medium text-sm">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Dashboard */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Пользователей', value: stats?.totalUsers || 0, color: 'text-blue-400' },
                                    { label: 'Активных офферов', value: stats?.activeOffers || 0, color: 'text-green-400' },
                                    { label: 'На модерации', value: stats?.pendingClips || 0, color: 'text-amber-400' },
                                    { label: 'Выплачено', value: `${((stats?.totalPaidOut || 0) / 1000).toFixed(0)}k ₽`, color: 'text-purple-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                                        <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Pending */}
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold">Ожидают модерации</h2>
                                    <button onClick={() => setActiveTab('clips')} className="text-sm text-blue-400 hover:text-blue-300">
                                        Все →
                                    </button>
                                </div>
                                {pendingClips.length === 0 ? (
                                    <p className="text-zinc-500 text-center py-8">Нет клипов на модерации 🎉</p>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingClips.map(clip => (
                                            <div key={clip.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                                                    {getPlatformIcon(clip.platform)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">@{clip.user.username || clip.user.firstName}</p>
                                                    <p className="text-xs text-zinc-500">{clip.offer.name} • {clip.offer.title}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setApproveModal({ clip, views: '' })}
                                                        className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ clip, reason: '' })}
                                                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Clips Moderation */}
                    {activeTab === 'clips' && (
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                            <h2 className="text-lg font-semibold mb-4">Клипы на модерации ({pendingClips.length})</h2>
                            {pendingClips.length === 0 ? (
                                <p className="text-zinc-500 text-center py-12">Все клипы проверены! 🎉</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingClips.map(clip => (
                                        <div key={clip.id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                                                {getPlatformIcon(clip.platform)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">@{clip.user.username || clip.user.firstName}</p>
                                                <p className="text-sm text-zinc-500">{clip.offer.name} — {clip.offer.title}</p>
                                                <a
                                                    href={clip.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-400 hover:underline block truncate"
                                                >
                                                    {clip.videoUrl}
                                                </a>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-zinc-400">CPM: {clip.offer.cpmRate} ₽</p>
                                                <p className="text-xs text-zinc-500">{new Date(clip.createdAt).toLocaleDateString('ru-RU')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setApproveModal({ clip, views: '' })}
                                                    className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 font-medium text-sm"
                                                >
                                                    Принять
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ clip, reason: '' })}
                                                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 font-medium text-sm"
                                                >
                                                    Отклонить
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Users */}
                    {activeTab === 'users' && !selectedUser && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Поиск по username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left p-4 text-sm font-medium text-zinc-500">Пользователь</th>
                                            <th className="text-left p-4 text-sm font-medium text-zinc-500">Баланс</th>
                                            <th className="text-left p-4 text-sm font-medium text-zinc-500">Клипы</th>
                                            <th className="text-left p-4 text-sm font-medium text-zinc-500">Кампании</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr
                                                key={user.id}
                                                className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                                                onClick={() => handleUserClick(user.id)}
                                            >
                                                <td className="p-4">
                                                    <p className="font-medium">@{user.username || 'anonymous'}</p>
                                                    <p className="text-sm text-zinc-500">{user.firstName}</p>
                                                </td>
                                                <td className="p-4 text-emerald-400 font-medium">{user.balance.toFixed(0)} ₽</td>
                                                <td className="p-4">{user.clipsCount}</td>
                                                <td className="p-4">{user.campaignsCount}</td>
                                                <td className="p-4"><ChevronRight size={16} className="text-zinc-500" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* User Detail */}
                    {activeTab === 'users' && selectedUser && (
                        <div className="space-y-6">
                            <button onClick={() => setSelectedUser(null)} className="text-sm text-blue-400 hover:text-blue-300">
                                ← Назад к списку
                            </button>

                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                                        {selectedUser.firstName?.[0] || '@'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">@{selectedUser.username || 'anonymous'}</h2>
                                        <p className="text-zinc-500">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        <p className="text-xs text-zinc-600">Telegram ID: {selectedUser.telegramId}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-2xl font-bold text-emerald-400">{selectedUser.balance.toFixed(0)} ₽</p>
                                        <p className="text-sm text-zinc-500">Баланс</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-zinc-800/50 rounded-xl p-4">
                                        <p className="text-zinc-500 text-sm">Всего заработал</p>
                                        <p className="text-xl font-bold text-white">{selectedUser.stats.totalEarned.toFixed(0)} ₽</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-xl p-4">
                                        <p className="text-zinc-500 text-sm">Просмотров</p>
                                        <p className="text-xl font-bold text-white">{selectedUser.stats.totalViews}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-xl p-4">
                                        <p className="text-zinc-500 text-sm">Одобрено</p>
                                        <p className="text-xl font-bold text-emerald-400">{selectedUser.stats.approvedClips}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-xl p-4">
                                        <p className="text-zinc-500 text-sm">Отклонено</p>
                                        <p className="text-xl font-bold text-red-400">{selectedUser.stats.rejectedClips}</p>
                                    </div>
                                </div>
                            </div>

                            {/* User Clips */}
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4">Клипы ({selectedUser.clips.length})</h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {selectedUser.clips.map((clip: any) => (
                                        <div key={clip.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                                            <div className={`w-2 h-2 rounded-full ${clip.status === 'approved' ? 'bg-emerald-500' :
                                                clip.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                                                }`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{clip.offerName}</p>
                                                <p className="text-xs text-zinc-500">{clip.platform} • {clip.views} просм.</p>
                                            </div>
                                            <p className="text-sm font-medium text-emerald-400">{clip.earnedAmount.toFixed(0)} ₽</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Offers */}
                    {activeTab === 'offers' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Офферы ({offers.length})</h2>
                                <button
                                    onClick={() => setShowOfferForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Plus size={16} />
                                    Добавить оффер
                                </button>
                            </div>

                            <div className="space-y-3">
                                {offers.map(offer => (
                                    <div key={offer.id} className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                                        <img src={offer.avatarUrl || offer.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{offer.name}</p>
                                            <p className="text-sm text-zinc-500">{offer.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{offer.cpmRate} ₽ CPM</p>
                                            <p className="text-sm text-zinc-500">{(offer.paidOutPercentage || 0).toFixed(0)}% выплачено</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${offer.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                                            }`}>
                                            {offer.isActive ? 'Активен' : 'Неактивен'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleOffer(offer.id)}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                                        >
                                            {offer.isActive ? 'Отключить' : 'Включить'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Approve Modal */}
            {approveModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Одобрить клип</h3>
                        <p className="text-zinc-400 text-sm mb-2">@{approveModal.clip.user.username} • {approveModal.clip.offer.name}</p>
                        <a href={approveModal.clip.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline block mb-4 truncate">
                            {approveModal.clip.videoUrl}
                        </a>

                        <div className="mb-4">
                            <label className="block text-sm text-zinc-500 mb-2">Количество просмотров</label>
                            <input
                                type="number"
                                value={approveModal.views}
                                onChange={(e) => setApproveModal({ ...approveModal, views: e.target.value })}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Заработок: {((parseInt(approveModal.views) || 0) / 1000 * approveModal.clip.offer.cpmRate).toFixed(0)} ₽
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setApproveModal(null)} className="flex-1 py-3 bg-zinc-800 rounded-lg font-medium">
                                Отмена
                            </button>
                            <button onClick={handleApprove} className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium">
                                Одобрить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Отклонить клип</h3>
                        <p className="text-zinc-400 text-sm mb-4">@{rejectModal.clip.user.username} • {rejectModal.clip.offer.name}</p>

                        <div className="mb-4">
                            <label className="block text-sm text-zinc-500 mb-2">Причина отклонения</label>
                            <textarea
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                placeholder="Укажите причину..."
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal(null)} className="flex-1 py-3 bg-zinc-800 rounded-lg font-medium">
                                Отмена
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectModal.reason.trim()}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Отклонить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Offer Modal */}
            {showOfferForm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Создать оффер</h3>
                            <button onClick={() => setShowOfferForm(false)} className="text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOffer} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Имя блогера *</label>
                                    <input
                                        type="text"
                                        value={offerForm.name}
                                        onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                                        placeholder="Exile"
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Название кампании *</label>
                                    <input
                                        type="text"
                                        value={offerForm.title}
                                        onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                                        placeholder="Смешные моменты"
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Тип</label>
                                    <select
                                        value={offerForm.type}
                                        onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    >
                                        <option value="STREAMER">Стример</option>
                                        <option value="YOUTUBER">Ютубер</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Язык</label>
                                    <input
                                        type="text"
                                        value={offerForm.language}
                                        onChange={(e) => setOfferForm({ ...offerForm, language: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Бюджет (₽) *</label>
                                    <input
                                        type="number"
                                        value={offerForm.totalBudget}
                                        onChange={(e) => setOfferForm({ ...offerForm, totalBudget: e.target.value })}
                                        placeholder="1500000"
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">CPM (₽) *</label>
                                    <input
                                        type="number"
                                        value={offerForm.cpmRate}
                                        onChange={(e) => setOfferForm({ ...offerForm, cpmRate: e.target.value })}
                                        placeholder="500"
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">Дней</label>
                                    <input
                                        type="number"
                                        value={offerForm.daysLeft}
                                        onChange={(e) => setOfferForm({ ...offerForm, daysLeft: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">URL изображения *</label>
                                    <input
                                        type="url"
                                        value={offerForm.imageUrl}
                                        onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2">URL аватара</label>
                                    <input
                                        type="url"
                                        value={offerForm.avatarUrl}
                                        onChange={(e) => setOfferForm({ ...offerForm, avatarUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            {/* Banner URL */}
                            <div>
                                <label className="block text-sm text-zinc-500 mb-2 flex items-center gap-2">
                                    <Image size={14} />
                                    URL баннера (для карточки оффера)
                                </label>
                                <input
                                    type="url"
                                    value={offerForm.bannerUrl}
                                    onChange={(e) => setOfferForm({ ...offerForm, bannerUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-500 mb-2">Описание</label>
                                <textarea
                                    value={offerForm.description}
                                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                                    placeholder="Делайте нарезки..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-500 mb-2">Требования (по одному на строку)</label>
                                <textarea
                                    value={offerForm.requirements}
                                    onChange={(e) => setOfferForm({ ...offerForm, requirements: e.target.value })}
                                    placeholder="Смех: самые разрывные моменты&#10;Эмоции: испуг, удивление&#10;Монтаж: динамичный"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-500 mb-2">Ссылка на материалы</label>
                                <input
                                    type="url"
                                    value={offerForm.assetsLink}
                                    onChange={(e) => setOfferForm({ ...offerForm, assetsLink: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-lg text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowOfferForm(false)} className="flex-1 py-3 bg-zinc-800 rounded-lg font-medium">
                                    Отмена
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium">
                                    Создать оффер
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mount
const root = createRoot(document.getElementById('root')!);
root.render(<AdminPanel />);
