import React from 'react';
import { ArrowLeft, Share2, Instagram, Youtube, Music, Download, CheckCircle, AlertCircle, Clock, Globe, Wallet, TrendingUp } from 'lucide-react';
import { Offer } from '../types';

interface OfferDetailsViewProps {
    offer: Offer;
    onBack: () => void;
    onJoin: () => void;
}

export const OfferDetailsView: React.FC<OfferDetailsViewProps> = ({ offer, onBack, onJoin }) => {
    if (!offer) return null;

    return (
        <div className="w-full flex flex-col pt-4 pb-24 animate-in slide-in-from-right duration-300 relative min-h-screen bg-[#09090b] overflow-hidden">

            {/* Navigation Header */}
            {/* Navigation Header - Pushed            {/* Navigation Header - Pushed down for Telegram UI */}
            <div className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md px-4 pt-14 pb-4 flex items-center justify-center border-b border-white/5 shadow-md">
                <span className="font-semibold text-white">Кампания</span>
            </div>

            <div className="px-4 mt-6 relative z-10">

                {/* Header Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden shadow-lg border border-white/10 relative group">
                        <img src={offer.avatarUrl || offer.imageUrl} alt={offer.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-xl font-bold text-white">{offer.name}</h1>
                            <CheckCircle size={16} className="text-blue-500 fill-blue-500/20" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                Active
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">Updated 3h ago</span>
                        </div>
                    </div>
                </div>

                {/* Campaign Title */}
                <h2 className="text-lg font-bold text-white mb-6 leading-snug">{offer.title}</h2>

                {/* Stats Row & Progress Bar (THE SCALE) */}
                <div className="glass-panel bg-[#18181b]/40 rounded-2xl p-5 mb-8 border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    <div className="flex justify-between items-end mb-3 relative z-10">
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Конец через</span>
                            <span className="text-2xl font-bold text-white tracking-tight">{offer.daysLeft || 14}д</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-bold text-white tracking-tight">{offer.paidOutPercentage?.toFixed(2) || '0.00'}%</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Выплачено</span>
                        </div>
                    </div>

                    {/* THE BLUE SCALE (Progress Bar) */}
                    <div className="w-full h-3.5 bg-zinc-800/50 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 50%, transparent 50%, transparent 75%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1) 100%)',
                                backgroundSize: '12px 12px'
                            }}
                        ></div>
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] relative"
                            style={{ width: `${offer.paidOutPercentage || 0}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                        </div>
                    </div>
                </div>

                {/* NEW META INFO GRID (Cards Style) */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {/* Language */}
                    <div className="bg-[#18181b]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 z-10">
                            <Globe size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-medium">Язык</span>
                        </div>
                        <span className="text-lg font-bold text-white z-10">{offer.language || 'Russian'}</span>
                    </div>

                    {/* Platforms */}
                    <div className="bg-[#18181b]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 z-10">
                            <Share2 size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-medium">Платформы</span>
                        </div>
                        <div className="flex gap-2 text-white z-10">
                            <Instagram size={20} className="hover:text-pink-500 transition-colors" />
                            <Music size={20} className="hover:text-cyan-400 transition-colors" />
                            <Youtube size={20} className="hover:text-red-500 transition-colors" />
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-[#18181b]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 z-10">
                            <Wallet size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-medium">Оплата</span>
                        </div>
                        <span className="text-lg font-bold text-white z-10 leading-tight">{offer.payType || 'За просмотр'}</span>
                    </div>

                    {/* Rate */}
                    <div className="bg-[#18181b]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 z-10">
                            <TrendingUp size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-medium">Ставка</span>
                        </div>
                        <div className="z-10">
                            <span className="text-lg font-bold text-white block leading-none mb-1">{offer.cpm}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Per 1000 views</span>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

                {/* Details (TZ) Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        Детали задания
                    </h3>
                    <div className="bg-[#18181b]/40 border border-white/5 rounded-2xl p-5">
                        <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                            {offer.description || 'Используйте самые смешные и яркие моменты из последнего видео/стрима. Ваша задача — сделать так, чтобы ролик залетел в рекомендации.'}
                        </p>

                        {offer.requirements && (
                            <div>
                                <h4 className="font-bold text-white text-sm mb-3 opacity-90">На что обратить внимание:</h4>
                                <ul className="space-y-2.5">
                                    {offer.requirements.map((req, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-zinc-400 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content to Use (Stylish Materials) */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Материалы</h3>
                    <a
                        href={offer.assetsLink || '#'}
                        className="relative overflow-hidden w-full bg-[#18181b]/80 border border-white/10 rounded-2xl p-2 flex items-center group hover:bg-[#202025] transition-all"
                    >
                        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center relative z-10 group-hover:border-blue-500/30 transition-colors">
                            <Download size={24} className="text-blue-500" />
                        </div>

                        <div className="flex-1 px-4 z-10 py-1">
                            <h4 className="text-sm font-bold text-white mb-0.5">Пак материалов</h4>
                            <p className="text-xs text-zinc-500">Google Drive • Исходники, лого</p>
                        </div>

                        <div className="mr-3 text-zinc-600 group-hover:text-white transition-colors z-10">
                            <ArrowLeft size={18} className="rotate-180" />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    </a>
                </div>

                {/* How It Works */}
                <div className="mb-24">
                    <h3 className="text-lg font-bold text-white mb-6">Как это работает</h3>

                    <div className="space-y-0 relative">
                        <div className="absolute left-[19px] top-4 bottom-8 w-[2px] bg-gradient-to-b from-blue-500 via-zinc-700 to-zinc-800 z-0 opacity-30"></div>

                        <div className="flex gap-5 relative z-10 pb-8">
                            <div className="w-10 h-10 rounded-full bg-[#09090b] border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                <CheckCircle size={18} className="text-blue-500" />
                            </div>
                            <div className="pt-1">
                                <h4 className="text-sm font-bold text-white mb-1.5">Модерация клипа</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                                    После публикации клиент проверит ваш клип. Только одобренные ролики участвуют в монетизации.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-5 relative z-10 pb-8">
                            <div className="w-10 h-10 rounded-full bg-[#09090b] border border-zinc-700 flex items-center justify-center flex-shrink-0">
                                <Clock size={18} className="text-zinc-400" />
                            </div>
                            <div className="pt-1">
                                <h4 className="text-sm font-bold text-white mb-1.5">Подсчет просмотров</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                                    Наберите минимум 1,000 просмотров. Статистика обновляется каждые 24 часа.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-5 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-[#09090b] border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={18} className="text-red-500" />
                            </div>
                            <div className="pt-1">
                                <h4 className="text-sm font-bold text-white mb-1.5">Правила</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                                    Запрещена накрутка, перезаливы и спам. Нарушение ведет к блокировке аккаунта.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-50">
                <button
                    onClick={onJoin}
                    className="w-full bg-white text-black font-bold text-lg py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-zinc-100"
                >
                    Участвовать в кампании
                </button>
            </div>

        </div>
    );
};
