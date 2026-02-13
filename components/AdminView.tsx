import React, { useState, useEffect } from 'react';
import { Users, Video, Search, ChevronRight, X, AlertTriangle, CheckCircle2, DollarSign, Wallet, ExternalLink } from 'lucide-react';
import { adminApi, offersApi } from '../services';

export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'clips' | 'users' | 'offers'>('clips');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');

    // Load users (mocked or real)
    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await adminApi.getUsers(searchQuery);
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers();
    };

    const handleUserClick = async (userId: number) => {
        try {
            const user = await adminApi.getUserDetails(userId);
            setSelectedUser(user);
            setPayoutAmount('');
        } catch (error) {
            alert('Не удалось загрузить данные пользователя');
        }
    };

    const handlePayout = async () => {
        if (!selectedUser) return;
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) return alert('Введите корректную сумму');
        if (amount > selectedUser.balance) return alert('Сумма превышает текущий баланс');

        if (!confirm(`Обнулить баланс на сумму ${amount} ₽?`)) return;

        try {
            await adminApi.payoutUser(selectedUser.id, amount);
            alert('Выплата проведена');
            // Reload user data
            handleUserClick(selectedUser.id);
        } catch (error) {
            alert('Ошибка выплаты');
        }
    };

    const handlePayoutFull = () => {
        if (selectedUser?.balance > 0) {
            setPayoutAmount(selectedUser.balance.toString());
        }
    };

    return (
        <div className="w-full min-h-screen pt-20 px-4 pb-24 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white mb-6">Админ панель v2.1 (Clips)</h1>

            {/* Navigation tabs */}
            <div className="flex bg-zinc-900 rounded-xl p-1 mb-6 border border-white/10 w-full max-w-md">
                <button
                    onClick={() => setActiveTab('clips')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'clips' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                    Клипы
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                    Юзеры
                </button>
                <button
                    onClick={() => setActiveTab('offers')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'offers' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                    Офферы
                </button>
            </div>

            {/* Content Area */}
            <div className="w-full max-w-md">
                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Поиск по юзернейму..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                            />
                            <Search className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                        </form>

                        {/* User List */}
                        {isLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
                        ) : (
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserClick(user.id)}
                                        className="w-full bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                                                {user.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-white flex items-center gap-2">
                                                    {user.username || 'No Username'}
                                                    {user.verificationCode && (
                                                        <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                                                            {user.verificationCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    Клипов: <span className="text-zinc-300">{user.clipsCount}</span> •
                                                    Баланс: <span className="text-emerald-400">{user.balance.toFixed(0)} ₽</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-zinc-600" />
                                    </button>
                                ))}
                                {users.length === 0 && <p className="text-center text-zinc-500 py-4">Пользователи не найдены</p>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clips' && <AdminClipsTab />}

                {activeTab === 'offers' && (
                    <div className="text-center text-zinc-500 py-10">
                        Управление офферами (в разработке)
                    </div>
                )}
            </div>

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                    <div className="relative w-full max-w-lg bg-[#18181b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-start justify-between bg-zinc-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">@{selectedUser.username}</h2>
                                <p className="text-xs text-zinc-500">ID: {selectedUser.telegramId}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} className="text-zinc-400" /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6">

                            {/* Balance & Payout Section */}
                            <div className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-white/5">
                                <div className="text-zinc-500 text-sm mb-1 uppercase tracking-wide">Текущий Баланс</div>
                                <div className="text-3xl font-bold text-emerald-400 mb-6">{selectedUser.balance.toFixed(2)} ₽</div>

                                <div className="space-y-3">
                                    <label className="text-xs text-zinc-400 block ml-1">Сумма выплаты</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-3.5 text-zinc-500">₽</span>
                                            <input
                                                type="number"
                                                value={payoutAmount}
                                                onChange={(e) => setPayoutAmount(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <button onClick={handlePayoutFull} className="px-4 py-3 bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-700">MAX</button>
                                    </div>
                                    <button
                                        onClick={handlePayout}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                                    >
                                        <Wallet size={18} />
                                        Списать средства (Выплачено)
                                    </button>
                                    <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                                        Нажатие кнопки спишет средства с баланса пользователя, но сохранит статистику заработка в истории клипов.
                                    </p>
                                </div>
                            </div>

                            {/* Clips History */}
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Video size={18} className="text-blue-400" />
                                Загруженные клипы
                            </h3>

                            <div className="space-y-3">
                                {selectedUser.clips?.map((clip: any) => (
                                    <div key={clip.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex gap-3">
                                        {/* Status Line */}
                                        <div className={`w-1 rounded-full ${clip.status === 'approved' ? 'bg-emerald-500' :
                                            clip.status === 'processing' ? 'bg-amber-500' : 'bg-red-500'
                                            }`}></div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-medium text-white truncate pr-2">{clip.title || 'Без названия'}</h4>
                                                <a href={clip.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300"><ChevronRight size={16} /></a>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-1.5">
                                                <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><Video size={10} /> {clip.views}</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-black/20 rounded-lg px-2 py-1">
                                                <span className="text-[10px] text-zinc-500 uppercase">{clip.offerName}</span>
                                                <span className="text-xs font-bold text-emerald-400">+{clip.earnedAmount?.toFixed(1) || 0} ₽</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedUser.clips?.length === 0 && <p className="text-center text-zinc-500 text-sm">Нет загруженных клипов</p>}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminClipsTab: React.FC = () => {
    const [clips, setClips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [offers, setOffers] = useState<any[]>([]);
    const [filterOfferId, setFilterOfferId] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadData();
    }, [filterOfferId, page]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [clipsData, offersData] = await Promise.all([
                adminApi.getClips({ offerId: filterOfferId, page, limit: 50 }),
                offersApi.getAll()
            ]);

            setClips(clipsData.clips || []);
            setTotalPages(clipsData.totalPages || 1);
            setOffers(offersData || []);
        } catch (error) {
            console.error('Failed to load clips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
            {/* Filter */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => { setFilterOfferId('all'); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${filterOfferId === 'all' ? 'bg-white text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                    Все офферы
                </button>
                {offers.map(offer => (
                    <button
                        key={offer.id}
                        onClick={() => { setFilterOfferId(offer.id); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${filterOfferId === offer.id ? 'bg-white text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        {offer.name}
                    </button>
                ))}
            </div>

            {/* Clips List */}
            {isLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
            ) : (
                <div className="space-y-3">
                    {clips.map((clip) => {
                        // Calculate days since creation
                        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(clip.createdAt).getTime()) / (1000 * 3600 * 24));
                        const isReadyForPayout = daysSinceCreation >= 5;

                        return (
                            <div key={clip.id} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 hover:bg-zinc-800/60 transition-colors">
                                <div className="flex justify-between items-start gap-3 mb-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">{clip.offer.name}</span>
                                            <span className="text-[10px] text-zinc-600 font-mono">
                                                {new Date(clip.createdAt).toLocaleDateString()}
                                                {isReadyForPayout ? <span className="text-emerald-500 ml-1">✓</span> : <span className="text-amber-500 ml-1">Wait</span>}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-white truncate text-sm leading-tight">{clip.title || 'Без названия'}</h4>
                                        <div className="text-xs text-zinc-500 mt-0.5">@{clip.user.username}</div>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <div className="font-bold text-emerald-400 text-sm">+{clip.earnedAmount?.toFixed(0)} ₽</div>
                                        <div className="text-xs text-zinc-500 flex items-center justify-end gap-1">
                                            {clip.views} <Video size={10} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded-full ${clip.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : clip.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {clip.status}
                                    </span>
                                    <a href={clip.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                        Смотреть <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                    {clips.length === 0 && <div className="text-center text-zinc-500 py-10">Клипы не найдены</div>}
                </div>
            )}
        </div>
    );
};
