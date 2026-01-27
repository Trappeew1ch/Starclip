import React, { useEffect, useState } from 'react';
import { Copy, UserPlus, Users, Check, ChevronLeft } from 'lucide-react';
import { referralsApi } from '../services';

interface Referral {
    id: number;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
    joinedAt: string;
}

interface ReferralInfo {
    referralCode: string;
    referralLink: string;
    referralCount: number;
    totalEarned: number;
}

interface ReferralViewProps {
    onBack: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onBack }) => {
    const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadReferralData = async () => {
            try {
                const [info, list] = await Promise.all([
                    referralsApi.getInfo(),
                    referralsApi.getList()
                ]);
                setReferralInfo(info);
                setReferrals(list);
            } catch (error) {
                console.error('Failed to load referral data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadReferralData();
    }, []);

    const handleCopyLink = async () => {
        if (!referralInfo?.referralLink) return;

        try {
            await navigator.clipboard.writeText(referralInfo.referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleShare = () => {
        if (!referralInfo?.referralLink) return;

        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralInfo.referralLink)}&text=${encodeURIComponent('Присоединяйся к StarClip и зарабатывай на клипах!')}`);
        } else {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralInfo.referralLink)}&text=${encodeURIComponent('Присоединяйся к StarClip и зарабатывай на клипах!')}`, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#09090b] relative flex flex-col items-center">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `url('/images/Заработак_Миниа_ап_страница_копия.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            ></div>
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#09090b]/80 to-[#09090b] z-0"></div>

            {/* Header */}
            <div className="w-full flex items-center px-4 pt-6 pb-4 relative z-20">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
                >
                    <ChevronLeft className="text-white" size={24} />
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-white mr-10">
                    Реферальная программа
                </h1>
            </div>

            <div className="w-full px-4 pb-24 relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Hero Card */}
                <div className="glass-panel bg-[#18181b]/60 rounded-2xl p-6 mb-6 border-white/5 shadow-xl backdrop-blur-xl">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 ring-4 ring-blue-500/5">
                            <UserPlus size={32} className="text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Приглашай друзей</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Получай <span className="text-blue-400 font-bold">10%</span> от заработка каждого приглашенного пользователя навсегда
                        </p>
                    </div>

                    {/* Link Display */}
                    <div className="bg-black/40 rounded-xl p-4 mb-4 flex items-center gap-3 border border-white/5">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Твоя ссылка</p>
                            <p className="text-sm text-white font-mono truncate">
                                {referralInfo?.referralLink || '...'}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors active:scale-95"
                        >
                            {copied ? (
                                <Check size={20} className="text-green-400" />
                            ) : (
                                <Copy size={20} className="text-zinc-400" />
                            )}
                        </button>
                    </div>

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} />
                        Пригласить друга
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-panel bg-[#18181b]/40 rounded-2xl p-4 border-white/5">
                        <p className="text-zinc-500 text-xs font-medium mb-1">Приглашено</p>
                        <p className="text-2xl font-bold text-white">{referralInfo?.referralCount || 0}</p>
                    </div>
                    <div className="glass-panel bg-[#18181b]/40 rounded-2xl p-4 border-white/5">
                        <p className="text-zinc-500 text-xs font-medium mb-1">Заработано</p>
                        <p className="text-2xl font-bold text-emerald-400">₽{referralInfo?.totalEarned?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>

                {/* Referrals List */}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-zinc-400" />
                        Мои рефералы
                    </h3>

                    {referrals.length > 0 ? (
                        <div className="space-y-3">
                            {referrals.map((referral) => (
                                <div
                                    key={referral.id}
                                    className="flex items-center gap-4 p-4 bg-[#18181b]/40 rounded-2xl border border-white/5"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center ring-2 ring-white/5">
                                        {referral.photoUrl ? (
                                            <img
                                                src={referral.photoUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-base font-bold text-zinc-500">
                                                {(referral.firstName || referral.username || '?')[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-medium text-white truncate">
                                            {referral.firstName || referral.username || 'Пользователь'}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            Присоединился {referral.joinedAt}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-2xl bg-[#18181b]/20 border border-white/5 border-dashed">
                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-zinc-600" />
                            </div>
                            <p className="text-zinc-400 font-medium">Список пуст</p>
                            <p className="text-sm text-zinc-500 mt-1">Пригласите друзей, чтобы начать зарабатывать</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
