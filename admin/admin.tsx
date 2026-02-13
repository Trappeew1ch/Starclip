import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Users, Film, DollarSign, Clock, Check, X, Plus, ChevronRight, RefreshCw, Youtube, Instagram, Music2, LogIn, Shield, Image, Upload, Menu, LayoutDashboard, Wallet, Video } from 'lucide-react';

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

// Upload file as base64
async function uploadFile(file: File): Promise<string> {
    const auth = getAdminAuth();
    if (!auth) throw new Error('Not authenticated');

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Id': auth.telegramId
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        data: reader.result,
                        mimeType: file.type
                    })
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                resolve(result.url);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
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
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 pt-16">
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'clips' | 'users' | 'offers' | 'payouts' | 'all_clips'>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingClips, setPendingClips] = useState<PendingClip[]>([]);
    const [allClips, setAllClips] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
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
        totalBudget: '',
        cpmRate: '',
        language: 'Russian',
        platforms: ['youtube', 'tiktok', 'instagram'],
        description: '',
        requirements: '',
        assetsLink: '',
        daysLeft: '30'
    });

    // File upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

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
            } else if (activeTab === 'all_clips') {
                const clipsData = await adminRequest<any>('/admin/clips?limit=50');
                setAllClips(clipsData.clips || []);
            } else if (activeTab === 'users') {
                const params = new URLSearchParams({ page: '1' });
                if (searchQuery) params.append('search', searchQuery);
                const usersData = await adminRequest<any>(`/admin/users?${params}`);
                setUsers(usersData.users);
            } else if (activeTab === 'offers') {
                const offersData = await adminRequest<any[]>('/admin/offers');
                setOffers(offersData);
            } else if (activeTab === 'payouts') {
                const payoutsData = await adminRequest<any[]>('/admin/payouts');
                setPayouts(payoutsData);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayoutConfirm = async (id: number) => {
        if (!confirm('Подтвердить выплату?')) return;
        try {
            await adminRequest(`/admin/payouts/${id}/confirm`, {}); // POST with empty body
            loadData();
        } catch (error) {
            alert('Ошибка подтверждения');
        }
    };

    const handlePayoutReject = async (id: number) => {
        if (!confirm('Отклонить и вернуть средства?')) return;
        try {
            await adminRequest(`/admin/payouts/${id}/reject`, {}); // POST with empty body
            loadData();
        } catch (error) {
            alert('Ошибка отклонения');
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

    const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

    const handleEditOffer = (offer: any) => {
        setEditingOfferId(offer.id);
        setOfferForm({
            name: offer.name,
            title: offer.title,
            type: offer.type,
            imageUrl: offer.imageUrl,
            avatarUrl: offer.avatarUrl || '',
            bannerUrl: offer.bannerUrl || '',
            totalBudget: offer.totalBudget.toString(),
            cpmRate: offer.cpmRate.toString(),
            language: offer.language,
            platforms: offer.platforms,
            description: offer.description || '',
            requirements: Array.isArray(offer.requirements) ? offer.requirements.join('\n') : '',
            assetsLink: offer.assetsLink || '',
            daysLeft: offer.daysLeft.toString()
        });
        setShowOfferForm(true);
    };

    const handleCreateOrUpdateOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsUploading(true);

            let finalImageUrl = offerForm.imageUrl;
            let finalAvatarUrl = offerForm.avatarUrl;

            // Upload files if selected
            if (imageFile) {
                finalImageUrl = await uploadFile(imageFile);
            }
            if (avatarFile) {
                finalAvatarUrl = await uploadFile(avatarFile);
            }

            const payload = {
                ...offerForm,
                imageUrl: finalImageUrl,
                avatarUrl: finalAvatarUrl,
                bannerUrl: '', // Deprecated
                totalBudget: Number(offerForm.totalBudget),
                cpmRate: Number(offerForm.cpmRate),
                daysLeft: Number(offerForm.daysLeft),
                requirements: offerForm.requirements.split('\n').filter(r => r.trim())
            };

            if (editingOfferId) {
                await adminRequest(`/admin/offers/${editingOfferId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await adminRequest('/admin/offers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            setShowOfferForm(false);
            setEditingOfferId(null);
            setOfferForm({
                name: '', title: '', type: 'STREAMER', imageUrl: '', avatarUrl: '',
                totalBudget: '', cpmRate: '', language: 'Russian', platforms: ['youtube', 'tiktok', 'instagram'],
                description: '', requirements: '', assetsLink: '', daysLeft: '30'
            });
            // Reset files and previews
            setImageFile(null);
            setImagePreview('');
            setAvatarFile(null);
            setAvatarPreview('');
            loadData();
        } catch (error: any) {
            console.error('Failed to save offer:', error);
            alert(error.message || 'Ошибка при сохранении оффера');
        } finally {
            setIsUploading(false);
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

    const [payoutAmount, setPayoutAmount] = useState('');

    const handlePayout = async () => {
        if (!selectedUser) return;
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) return alert('Введите корректную сумму');
        if (amount > selectedUser.balance) return alert('Сумма превышает текущий баланс');

        if (!confirm(`Обнулить баланс на сумму ${amount} ₽?`)) return;

        try {
            await adminRequest(`/admin/users/${selectedUser.id}/payout`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
            alert('Выплата проведена');
            setPayoutAmount('');
            handleUserClick(selectedUser.id); // Reload user
        } catch (error: any) {
            alert(error.message || 'Ошибка выплаты');
        }
    };

    // Helper for image URLs
    const getImgUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/api')) return url;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
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
        <div className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden">
            {/* Header */}
            <header
                className="border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-xl sticky top-0 z-50"
                style={{ paddingTop: 'max(32px, env(safe-area-inset-top, 32px))' }}
            >
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        StarClip Admin v2.2
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

            <div className="max-w-7xl mx-auto p-4 pb-20 md:pb-4 flex gap-6">
                {/* Sidebar - hidden on mobile */}
                <nav className="hidden md:block w-56 flex-shrink-0">
                    <div className="sticky top-20 space-y-1">
                        {[
                            { id: 'dashboard', icon: DollarSign, label: 'Дашборд' },
                            { id: 'clips', icon: Clock, label: 'Модерация', badge: stats?.pendingClips },
                            { id: 'all_clips', icon: Film, label: 'Все Клипы' },
                            { id: 'payouts', icon: Wallet, label: 'Выплаты', badge: stats?.pendingPayouts },
                            { id: 'users', icon: Users, label: 'Пользователи' },
                            { id: 'offers', icon: LayoutDashboard, label: 'Офферы' },
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
                            {/* Stats Grid - responsive */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

                    {/* All Clips View */}
                    {activeTab === 'all_clips' && (
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                            <h2 className="text-lg font-semibold mb-4">Все клипы (Последние 50)</h2>
                            <div className="space-y-3">
                                {allClips.map((clip: any) => {
                                    const daysSinceCreation = Math.floor((new Date().getTime() - new Date(clip.createdAt).getTime()) / (1000 * 3600 * 24));
                                    const isReadyForPayout = daysSinceCreation >= 5;
                                    return (
                                        <div key={clip.id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                                                <Video size={24} className="text-zinc-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{clip.title || 'No Title'}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${clip.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                                        {clip.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-500">
                                                    @{clip.user.username} • {clip.offer.name}
                                                    {isReadyForPayout && clip.status === 'approved' && <span className="text-emerald-500 ml-1">✓ Готов к выплате</span>}
                                                </p>
                                                <a href={clip.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                                                    {clip.videoUrl}
                                                </a>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-400">+{clip.earnedAmount?.toFixed(0)} ₽</p>
                                                <p className="text-xs text-zinc-500">{clip.views} просмотров</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {allClips.length === 0 && <p className="text-center text-zinc-500 py-8">Клипов нет</p>}
                            </div>
                        </div>
                    )}

                    {/* Payouts */}
                    {activeTab === 'payouts' && (
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <h2 className="font-semibold text-lg text-white">Заявки на вывод</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-zinc-400 bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Пользователь</th>
                                            <th className="px-4 py-3 font-medium">Telegram ID</th>
                                            <th className="px-4 py-3 font-medium">Сумма</th>
                                            <th className="px-4 py-3 font-medium">Реквизиты</th>
                                            <th className="px-4 py-3 font-medium">Дата</th>
                                            <th className="px-4 py-3 font-medium">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {payouts.map(req => (
                                            <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-white">
                                                    <div className="font-medium">{req.user.firstName}</div>
                                                    <div className="text-xs text-zinc-500">@{req.user.username}</div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{req.user.telegramId}</td>
                                                <td className="px-4 py-3 text-green-400 font-bold">{req.amount} ₽</td>
                                                <td className="px-4 py-3 text-zinc-300">{req.wallet || 'Не указан'}</td>
                                                <td className="px-4 py-3 text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePayoutConfirm(req.id)}
                                                            className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                                                            title="Подтвердить выплату"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePayoutReject(req.id)}
                                                            className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                                            title="Отклонить"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {payouts.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Нет активных заявок на вывод</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[500px]">
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
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">@{user.username || 'anonymous'}</p>
                                                            {user.verificationCode && (
                                                                <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-white/5">
                                                                    {user.verificationCode}
                                                                </span>
                                                            )}
                                                        </div>
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

                                {/* PAYOUT SECTION */}
                                <div className="mb-6 bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                                    <h4 className="font-bold mb-3 text-sm">Списание / Выплата</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Сумма"
                                            value={payoutAmount}
                                            onChange={e => setPayoutAmount(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white w-32"
                                        />
                                        <button onClick={() => setPayoutAmount(selectedUser.balance.toString())} className="px-3 py-2 bg-zinc-700 rounded-lg text-xs">MAX</button>
                                        <button onClick={handlePayout} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm">
                                            Выплатить
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                                                <a href={clip.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">{clip.platform} • {clip.videoUrl}</a>
                                                <p className="text-xs text-zinc-500">{clip.views} просм.</p>
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
                                    onClick={() => {
                                        setEditingOfferId(null);
                                        setOfferForm({
                                            name: '', title: '', type: 'STREAMER', imageUrl: '', avatarUrl: '', bannerUrl: '',
                                            totalBudget: '', cpmRate: '', language: 'Russian', platforms: ['youtube', 'tiktok', 'instagram'],
                                            description: '', requirements: '', assetsLink: '', daysLeft: '30'
                                        });
                                        setImageFile(null);
                                        setImagePreview('');
                                        setAvatarFile(null);
                                        setAvatarPreview('');
                                        setShowOfferForm(true);
                                    }}
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
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditOffer(offer)}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded text-sm"
                                            >
                                                Изм.
                                            </button>
                                            <button
                                                onClick={() => handleToggleOffer(offer.id)}
                                                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                                            >
                                                {offer.isActive ? 'Откл.' : 'Вкл.'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Bottom Tabs */}
            <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/10 z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Дашборд' },
                        { id: 'clips', icon: Clock, label: 'Модерация', badge: stats?.pendingClips },
                        { id: 'users', icon: Users, label: 'Юзеры' },
                        { id: 'offers', icon: Film, label: 'Офферы' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === item.id
                                ? 'text-blue-400'
                                : 'text-zinc-500'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

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
                            <h3 className="text-lg font-bold">{editingOfferId ? 'Редактировать оффер' : 'Создать оффер'}</h3>
                            <button onClick={() => setShowOfferForm(false)} className="text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdateOffer} className="space-y-4">
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


                            <div className="grid grid-cols-2 gap-6">
                                {/* Main Image Upload */}
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2 flex items-center gap-2">
                                        <Image size={14} />
                                        Главное изображение *
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex flex-col items-center justify-center w-full h-32 bg-zinc-800 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all group overflow-hidden relative">
                                            {(imagePreview || offerForm.imageUrl) ? (
                                                <img
                                                    src={imagePreview || getImgUrl(offerForm.imageUrl)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-500 group-hover:text-blue-400">
                                                    <Upload size={24} className="mb-2" />
                                                    <p className="text-xs">Загрузить файл</p>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-sm font-medium text-white drop-shadow-md">Изменить</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required={!offerForm.imageUrl && !imageFile}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setImageFile(file);
                                                        setImagePreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[10px] text-zinc-600 text-center">Отображается в ленте офферов</p>
                                    </div>
                                </div>

                                {/* Avatar Upload */}
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-2 flex items-center gap-2">
                                        <Users size={14} />
                                        Аватар *
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex flex-col items-center justify-center w-full h-32 bg-zinc-800 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all group overflow-hidden relative">
                                            {(avatarPreview || offerForm.avatarUrl) ? (
                                                <img
                                                    src={avatarPreview || getImgUrl(offerForm.avatarUrl)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-500 group-hover:text-blue-400">
                                                    <Upload size={24} className="mb-2" />
                                                    <p className="text-xs">Загрузить файл</p>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-sm font-medium text-white drop-shadow-md">Изменить</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setAvatarFile(file);
                                                        setAvatarPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[10px] text-zinc-600 text-center">Иконка канала/блогера</p>
                                    </div>
                                </div>
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
                                <button type="button" onClick={() => setShowOfferForm(false)} className="flex-1 py-3 bg-zinc-800 rounded-lg font-medium" disabled={isUploading}>
                                    Отмена
                                </button>
                                <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:cursor-wait rounded-lg font-medium flex items-center justify-center gap-2">
                                    {isUploading ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={16} />
                                            Загрузка...
                                        </>
                                    ) : (
                                        editingOfferId ? 'Сохранить изменения' : 'Создать оффер'
                                    )}
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
