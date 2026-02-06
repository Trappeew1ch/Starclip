import React, { useEffect, useState } from 'react';
import { Copy, UserPlus, Users, Check } from 'lucide-react';
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

export const ReferralSection: React.FC = () => {
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
            <div className="w-full flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full mb-24 relative z-10">
            {/* Header Banner with Background */}
            <div
                className="relative w-full rounded-2xl overflow-hidden mb-6"
                style={{
                    backgroundImage: `url('/images/Заработак_Миниа_ап_страница_копия.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    minHeight: '280px'
                }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#09090b]"></div>
            </div>

            {/* Referral Link Block */}
            <div className="glass-shine rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-white">Твоя реферальная ссылка</h3>
                        <p className="text-xs text-zinc-500">10% с заработка каждого реферала</p>
                    </div>
                </div>

                {/* Link Display */}
                <div className="bg-zinc-900/60 rounded-xl p-3 mb-3 flex items-center gap-2 border border-white/5">
                    <span className="text-sm text-zinc-300 flex-1 truncate font-mono">
                        {referralInfo?.referralLink || 'Загрузка...'}
                    </span>
                    <button
                        onClick={handleCopyLink}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        {copied ? (
                            <Check size={16} className="text-green-400" />
                        ) : (
                            <Copy size={16} className="text-zinc-400" />
                        )}
                    </button>
                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                    Поделиться
                </button>
            </div>

            {/* Referrals List */}
            <div className="glass-shine rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-zinc-400" />
                        <h3 className="text-base font-bold text-white">Рефералы</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                            {referralInfo?.referralCount || 0}
                        </span>
                    </div>
                </div>

                {referrals.length > 0 ? (
                    <div className="space-y-3">
                        {referrals.map((referral) => (
                            <div
                                key={referral.id}
                                className="flex items-center gap-3 p-3 bg-zinc-900/40 rounded-xl border border-white/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                                    {referral.photoUrl ? (
                                        <img
                                            src={referral.photoUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-zinc-500">
                                            {(referral.firstName || referral.username || '?')[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {referral.firstName || referral.username || 'Пользователь'}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {referral.joinedAt}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                            <Users size={32} className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium">Нет рефералов</p>
                        <p className="text-sm text-zinc-500 mt-1">У вас ещё нет рефералов</p>
                        <button
                            onClick={handleShare}
                            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
                        >
                            Пригласить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
