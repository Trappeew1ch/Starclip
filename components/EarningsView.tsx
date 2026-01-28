import React, { useEffect, useState } from 'react';
import { ChevronRight, Play, Users } from 'lucide-react';
import { EarningsClip, ViewType } from '../types';
import { usersApi } from '../services';

interface Stats {
    balance: number;
    profiles: number;
    videos: number;
    followers: number;
    totalViews: number;
    avgViews: number;
    topClips: Array<{
        id: string;
        title: string;
        views: string;
        earned: string;
        imageUrl: string;
        date: string;
    }>;
}

interface EarningsViewProps {
    onNavigate: (view: ViewType) => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await usersApi.getStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleWithdraw = async () => {
        try {
            const result = await usersApi.withdraw();
            if (result.supportUrl) {
                window.open(result.supportUrl, '_blank');
            }
        } catch (error: any) {
            alert(error.message || 'Ошибка при запросе вывода');
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center pt-32">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center pt-8 px-2 animate-in fade-in duration-500 relative min-h-[80vh] overflow-x-hidden">

            {/* --- LIGHTING SETUP --- */}
            <div className="absolute top-16 left-0 w-[60px] h-[160px] bg-blue-500/80 blur-[60px] pointer-events-none z-0"></div>
            <div className="absolute top-16 right-0 w-[60px] h-[160px] bg-white/60 blur-[60px] pointer-events-none z-0"></div>
            <div className="absolute top-[380px] right-[52%] w-20 h-20 bg-blue-600 blur-[40px] opacity-40 rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-[380px] left-[52%] w-20 h-20 bg-white blur-[40px] opacity-30 rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[150px] h-[200px] bg-blue-600/30 blur-[80px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[150px] h-[200px] bg-white/10 blur-[80px] pointer-events-none z-0"></div>

            {/* 4. BALANCE SECTION */}
            <div className="flex flex-col items-center w-full mb-10 relative z-10">

                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-24 h-24 bg-white blur-[35px] opacity-60 rounded-full pointer-events-none"></div>
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#1792de] blur-[60px] opacity-40 rounded-full pointer-events-none"></div>
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#1792de] blur-[25px] opacity-70 rounded-full pointer-events-none"></div>
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#1792de] blur-[6px] opacity-100 rounded-full pointer-events-none"></div>

                {/* 3D Dollar Icon */}
                <div className="relative w-64 h-64 -mb-14 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-0">
                    <img
                        src="https://i.imgur.com/NgN4tsC.png"
                        alt="3D Dollar"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Balance Text */}
                <div className="relative z-10 flex flex-col items-center">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-1 drop-shadow-lg">
                        ₽{stats?.balance.toFixed(2) || '0.00'}
                    </h1>
                    <p className="text-sm font-normal text-zinc-400 mb-6">
                        общий баланс в RUB
                    </p>

                    {/* Withdraw Button */}
                    <button
                        onClick={handleWithdraw}
                        className="bg-white text-black font-bold text-base px-12 py-3.5 rounded-[32px] hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-95"
                    >
                        Вывести
                    </button>
                </div>
            </div>

            {/* REFERRAL BANNER */}
            <div className="w-full px-4 mb-8 relative z-10 max-w-sm">
                <button
                    onClick={() => onNavigate('referral')}
                    className="w-full relative group overflow-hidden rounded-[32px] transition-transform active:scale-[0.98]"
                >
                    <div className="w-full aspect-[3/1] relative rounded-[32px] overflow-hidden shadow-lg border border-white/5">
                        <img
                            src="/images/referral-banner.png"
                            alt="Referral Program"
                            className="w-full h-full object-cover"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                </button>
            </div>

            {/* 5. STATS REDESIGN (Single Block) */}
            <div className="w-full mb-8 relative z-10">
                <div className="flex justify-center items-center mb-4 px-2">
                    <h2 className="text-xl font-bold text-white text-center">Моя статистика</h2>
                </div>

                {/* Combined Stats Container */}
                <div className="glass-panel bg-[#18181b]/30 rounded-[32px] flex flex-col border-white/5 shadow-lg backdrop-blur-md overflow-hidden">
                    {/* Row 1: Profiles */}
                    <div className="px-4 h-12 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-medium text-zinc-400">Профили</span>
                        <span className="text-lg font-bold text-white tracking-tight">{stats?.profiles || 0}</span>
                    </div>

                    {/* Row 2: Videos */}
                    <div className="px-4 h-12 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-medium text-zinc-400">Видео</span>
                        <span className="text-lg font-bold text-white tracking-tight">{stats?.videos || 0}</span>
                    </div>

                    {/* Row 3: Subscribers */}
                    <div className="px-4 h-12 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-medium text-zinc-400">Подписчики</span>
                        <span className="text-lg font-bold text-white tracking-tight">{formatNumber(stats?.followers || 0)}</span>
                    </div>

                    {/* Row 4: Views */}
                    <div className="px-4 h-12 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-medium text-zinc-400">Просмотры</span>
                        <span className="text-lg font-bold text-white tracking-tight">{formatNumber(stats?.totalViews || 0)}</span>
                    </div>

                    {/* Row 5: Avg Views */}
                    <div className="px-4 h-12 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Средние просмотры</span>
                        <span className="text-lg font-bold text-white tracking-tight">{formatNumber(stats?.avgViews || 0)}</span>
                    </div>
                </div>
            </div>

            {/* 6. TOP CLIPS SECTION */}
            <div className="w-full mb-8 relative z-10">
                <div className="flex justify-center items-center mb-4 px-2">
                    <h2 className="text-lg font-bold text-white text-center">Топ клипы</h2>
                </div>

                <div className="flex flex-col gap-3">
                    {stats?.topClips && stats.topClips.length > 0 ? stats.topClips.map((clip) => (
                        <div key={clip.id} className="relative group w-full">
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-blue-600/20 blur-lg rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="glass-panel rounded-[32px] p-3 flex items-center gap-4 relative z-10 bg-[#18181b]/60 border-white/5 hover:bg-[#18181b]/80 transition-colors">
                                {/* Clip Thumbnail */}
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                                    <img src={clip.imageUrl} alt={clip.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <Play size={12} className="fill-white text-white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-white truncate pr-2">
                                        {clip.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                                        {clip.date} • {clip.views} прос.
                                    </p>
                                </div>

                                {/* Earnings */}
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                        {clip.earned}
                                    </div>
                                    <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide mt-0.5">
                                        Доход
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-zinc-500">
                            <p>У вас пока нет одобренных клипов</p>
                            <p className="text-sm mt-1">Начните добавлять клипы в кампании!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 7. REFERRAL SECTION REMOVED */}
        </div >
    );
};