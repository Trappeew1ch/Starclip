import React, { useEffect, useState } from 'react';
import { Copy, UserPlus, Check, ChevronLeft } from 'lucide-react';
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
            {/* Background Image - Full Screen Fixed */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/images/Заработак_Миниа_ап_страница_копия.jpg')`
                }}
            ></div>

            {/* Gradient Overlay only at very bottom for text readability */}
            <div className="fixed inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent z-0 pointer-events-none"></div>

            {/* Header - Transparent and floating */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-20 flex justify-between items-center pointer-events-none">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all pointer-events-auto hover:bg-black/60 border border-white/10"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Main Content - Pushed down to start from middle (approx 48vh) */}
            <div className="w-full px-4 pb-12 relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 mt-[48vh]">

                {/* Your Link Section */}
                <div className="glass-panel bg-[#18181b]/80 rounded-2xl p-5 mb-4 border-white/5 backdrop-blur-xl shadow-2xl">
                    <p className="text-center text-sm font-medium text-zinc-300 mb-3">Ваша реферальная ссылка</p>

                    {/* Link Box */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-black/40 rounded-xl px-4 py-3 border border-white/5 font-mono text-sm text-blue-400 truncate text-center">
                            {referralInfo?.referralLink || (
                                <span className="text-zinc-500 animate-pulse">Загрузка ссылки...</span>
                            )}
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 transition-colors active:scale-95"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>

                    <button
                        onClick={handleShare}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} />
                        Пригласить друга
                    </button>
                </div>

                {/* Compact Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="glass-panel bg-[#18181b]/60 rounded-xl p-3 border-white/5 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white mb-0.5">{referralInfo?.referralCount || 0}</span>
                        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Приглашено</span>
                    </div>
                    <div className="glass-panel bg-[#18181b]/60 rounded-xl p-3 border-white/5 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-400 mb-0.5">₽{referralInfo?.totalEarned?.toFixed(0) || '0'}</span>
                        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Заработано</span>
                    </div>
                </div>

                {/* Referrals List */}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-4 text-center">Мои рефералы</h3>

                    {referrals.length > 0 ? (
                        <div className="space-y-2">
                            {referrals.map((referral) => (
                                <div
                                    key={referral.id}
                                    className="flex items-center gap-3 p-3 bg-[#18181b]/40 rounded-xl border border-white/5 active:bg-[#18181b]/60 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center ring-1 ring-white/5 shrink-0">
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
                                        <p className="text-[10px] text-zinc-500">
                                            {referral.joinedAt}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 text-sm">У вас пока нет рефералов</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
