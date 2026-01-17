import React, { useState, useEffect } from 'react';
import { Offer, CreatorType } from '../types';
import { useApp } from '../context';

interface OfferSectionProps {
    offers: any[];
    onOfferClick: (offer: any) => void;
}

export const OfferSection: React.FC<OfferSectionProps> = ({ offers, onOfferClick }) => {
    const { loadOffers } = useApp();
    const [activeTab, setActiveTab] = useState<CreatorType>(CreatorType.STREAMER);

    // Reload offers when tab changes
    useEffect(() => {
        loadOffers(activeTab);
    }, [activeTab]);

    const filteredOffers = offers.filter(offer => offer.type === activeTab);

    return (
        <div className="w-full relative">

            {/* Section Title */}
            <h2 className="text-lg font-bold text-white mb-2 px-2">
                Активные офферы
            </h2>

            {/* Tabs - Pill Shape & Reduced Height */}
            <div className="flex p-1 glass-panel rounded-full mb-5 mx-1">
                <button
                    onClick={() => setActiveTab(CreatorType.STREAMER)}
                    className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors relative ${activeTab === CreatorType.STREAMER
                            ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    Стримеры
                </button>
                <button
                    onClick={() => setActiveTab(CreatorType.YOUTUBER)}
                    className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors relative ${activeTab === CreatorType.YOUTUBER
                            ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    Ютуберы
                </button>
            </div>

            {/* Cards List */}
            <div className="flex flex-col gap-6">
                {filteredOffers.map((offer) => (
                    <button
                        key={offer.id}
                        onClick={() => onOfferClick(offer)}
                        className="relative w-full mb-1 group text-left transition-transform active:scale-[0.98]"
                    >
                        {/* THE BEAM GLOW */}
                        <div
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[40%] h-[120px] blur-[50px] opacity-50 z-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-70 ${offer.glowColor === 'blue' ? 'bg-sky-600' : 'bg-yellow-600'
                                }`}
                        ></div>

                        <div
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[35%] h-[16px] blur-[12px] opacity-80 z-20 pointer-events-none bg-gradient-to-r ${offer.glowColor === 'blue'
                                    ? 'from-sky-500 to-transparent'
                                    : 'from-yellow-500 to-transparent'
                                }`}
                        ></div>

                        <div
                            className={`absolute -left-5 top-[25%] -translate-y-1/2 w-[4px] h-[25px] blur-[6px] opacity-100 z-40 pointer-events-none transition-all duration-500 group-hover:h-[40px] group-hover:blur-[10px] ${offer.glowColor === 'blue' ? 'bg-sky-300' : 'bg-yellow-300'
                                }`}
                        ></div>


                        <div className="flex flex-col relative">

                            {/* Image Area */}
                            <div className="relative z-30 w-full aspect-[2.61/1] rounded-[2rem] overflow-hidden shadow-2xl bg-[#09090b]">
                                <img
                                    src={offer.imageUrl}
                                    alt={offer.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Info Strip */}
                            <div className="relative z-10 -mt-8 pt-9 pb-4 px-5 bg-[#18181b] border border-white/5 rounded-b-[2rem] shadow-lg">

                                {/* Video Title */}
                                <div className="mb-3">
                                    <h3 className="text-base font-semibold text-white leading-snug">
                                        {offer.title}
                                    </h3>
                                </div>

                                {/* Stats Grid */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    {/* Budget */}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                            Бюджет
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {typeof offer.totalBudget === 'number'
                                                ? `${(offer.totalBudget / 1000).toFixed(0)}k ₽`
                                                : offer.budget || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Progress indicator */}
                                    <div className="flex-1 mx-4">
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${offer.glowColor === 'blue'
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                                                        : 'bg-gradient-to-r from-yellow-600 to-amber-400'
                                                    }`}
                                                style={{ width: `${offer.paidOutPercentage || 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] text-zinc-500 mt-0.5 block text-center">
                                            {(offer.paidOutPercentage || 0).toFixed(0)}% выплачено
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                            CPM
                                        </span>
                                        <span className={`text-sm font-bold ${offer.glowColor === 'blue'
                                                ? 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                                                : 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]'
                                            }`}>
                                            {typeof offer.cpmRate === 'number'
                                                ? `${offer.cpmRate} ₽`
                                                : offer.cpm || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}

                {filteredOffers.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 font-medium">
                        Нет доступных офферов
                    </div>
                )}
            </div>
        </div>
    );
};