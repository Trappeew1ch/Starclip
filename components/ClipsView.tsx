import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Youtube, Instagram, Music2, Clock, CheckCircle2, FileText, LayoutList, Plus, X, Download, ExternalLink, Play, UploadCloud, Link, AlertTriangle, MessageCircle, BarChart2, ArrowRight, ShieldCheck, Copy } from 'lucide-react';
import { MyCampaign, SocialAccount, AccountVideo } from '../types';
import { clipsApi, usersApi, campaignsApi } from '../services';

interface ClipsViewProps {
    campaigns: MyCampaign[];
}

export const ClipsView: React.FC<ClipsViewProps> = ({ campaigns }) => {
    // Data State
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [videos, setVideos] = useState<AccountVideo[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // UI State
    const [selectedAccount, setSelectedAccount] = useState<SocialAccount | { id: 'all', name: 'Все аккаунты' }>({ id: 'all', name: 'Все аккаунты' });
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

    // Modals
    const [activeModal, setActiveModal] = useState<'directions' | 'posts' | 'upload' | 'connect' | 'videoDetail' | 'verification' | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<AccountVideo | null>(null);
    const [uploadLink, setUploadLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carousel State
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Drag State
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [accountsData, clipsData] = await Promise.all([
                    usersApi.getAccounts(),
                    clipsApi.getAll()
                ]);
                setAccounts(accountsData);
                setVideos(clipsData);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, []);

    // --- LOGIC ---

    const handleUpload = async () => {
        if (!uploadLink || !selectedCampaignId) return;

        setIsSubmitting(true);
        try {
            const result = await clipsApi.submit(uploadLink, selectedCampaignId);

            // Add to local videos
            const newVideo: AccountVideo = {
                id: result.clip.id,
                accountId: result.clip.platform,
                campaignId: selectedCampaignId,
                title: `Клип для кампании`,
                status: 'processing',
                views: '0',
                date: 'Только что',
                thumbnailUrl: 'https://imgur.com/6mIWjbX.png'
            };
            setVideos([newVideo, ...videos]);
            setUploadLink('');
            setActiveModal(null);
        } catch (error: any) {
            alert(error.message || 'Ошибка при отправке');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConnectAccount = async (platform: 'youtube' | 'tiktok' | 'instagram') => {
        try {
            const newAcc = await usersApi.addAccount(platform, `New ${platform} User`);
            setAccounts([...accounts, newAcc]);
            setSelectedAccount(newAcc);
            setActiveModal(null);
        } catch (error) {
            console.error('Failed to connect account:', error);
        }
    };

    const handleAppeal = () => {
        const supportUsername = 'starclip_support'; // Will be configured from env
        window.open(`https://t.me/${supportUsername}`, '_blank');
    };

    // Filter Logic
    const filteredVideos = videos.sort((a, b) => {
        // Processing first
        if (a.status === 'processing' && b.status !== 'processing') return -1;
        if (a.status !== 'processing' && b.status === 'processing') return 1;
        // Then by date desc
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Accepted videos only for "Recent Clips" section
    const recentAcceptedVideos = videos.filter(v => v.status === 'published');

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDown(true);
        scrollContainerRef.current.style.scrollSnapType = 'none';
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };
    const handleMouseLeave = () => {
        setIsDown(false);
        if (scrollContainerRef.current) scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
    };
    const handleMouseUp = () => {
        setIsDown(false);
        if (scrollContainerRef.current) scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;
        const cards = Array.from(container.children) as HTMLElement[];
        let minDiff = Number.MAX_VALUE;
        let closestIndex = 0;
        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const diff = Math.abs(center - cardCenter);
            if (diff < minDiff) { minDiff = diff; closestIndex = index; }
        });
        if (closestIndex !== activeIndex) setActiveIndex(closestIndex);
    };

    const openModal = (type: typeof activeModal, id?: string) => {
        if (isDown) return;
        if (id) setSelectedCampaignId(id);
        setUploadLink('');
        setActiveModal(type);
    };

    const getSelectedCampaign = () => campaigns.find(c => c.id === selectedCampaignId);

    const renderPlatformIcon = (platform: string, className: string) => {
        switch (platform) {
            case 'youtube': return <Youtube className={`text-red-500 ${className}`} />;
            case 'instagram': return <Instagram className={`text-pink-500 ${className}`} />;
            case 'tiktok': return <Music2 className={`text-cyan-400 ${className}`} />;
            default: return null;
        }
    };

    if (isLoadingData) {
        return (
            <div className="w-full flex items-center justify-center pt-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col pt-20 px-4 pb-24 animate-in fade-in duration-500 relative min-h-screen">

            <div className="fixed top-20 -right-10 w-[100px] h-[250px] bg-blue-600/50 blur-[80px] pointer-events-none z-0"></div>
            <div className="fixed top-[400px] -left-10 w-[100px] h-[250px] bg-blue-600/40 blur-[80px] pointer-events-none z-0"></div>

            <h1 className="text-2xl font-bold text-white mb-5 drop-shadow-lg relative z-10 text-center">Мои кампании</h1>

            {/* 1. ACTIVE CAMPAIGNS */}
            {campaigns.length === 0 ? (
                <div className="w-full glass-panel bg-zinc-900/60 rounded-2xl p-8 mb-8 text-center border-dashed border-2 border-zinc-700">
                    <p className="text-zinc-400 mb-2">У вас нет активных кампаний</p>
                    <p className="text-sm text-zinc-500">Перейдите на главную, чтобы выбрать оффер</p>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className="relative z-10 w-[calc(100%+2rem)] -ml-4 mb-8 overflow-x-auto no-scrollbar snap-x snap-mandatory flex items-center py-4 cursor-grab active:cursor-grabbing select-none"
                    style={{ paddingLeft: '5%', paddingRight: '5%' }}
                >
                    {campaigns.map((camp, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <div
                                key={camp.id}
                                className={`flex-shrink-0 w-[90%] snap-center transition-all duration-300 ease-out px-1.5 ${isActive ? 'scale-100 opacity-100 z-10' : 'scale-[0.95] opacity-50 blur-[0.5px] z-0'
                                    }`}
                            >
                                <div className="glass-shine bg-zinc-900/60 backdrop-blur-xl border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden flex flex-col h-full ring-1 ring-white/5">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden shadow-inner">
                                                <img src={camp.avatarUrl} alt={camp.channelName} className="w-full h-full object-cover pointer-events-none" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-lg text-white">{camp.channelName}</span>
                                                    <CheckCircle2 size={14} className="text-blue-500 fill-blue-500/20" />
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                                    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Live</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex flex-col items-end backdrop-blur-md">
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Ставка</span>
                                            <span className="text-sm font-bold text-white leading-none mt-0.5">{camp.rate}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 mb-6 bg-black/30 rounded-xl p-3 border border-white/5">
                                        <div className="flex flex-col items-center"><span className="text-sm font-bold text-white">{camp.earned}</span><span className="text-[9px] text-zinc-500 uppercase mt-1">Доход</span></div>
                                        <div className="flex flex-col items-center border-l border-white/5"><span className="text-sm font-bold text-white">{camp.views}</span><span className="text-[9px] text-zinc-500 uppercase mt-1">ПМ</span></div>
                                        <div className="flex flex-col items-center border-l border-white/5"><span className="text-sm font-bold text-white">{camp.daysLeft}д</span><span className="text-[9px] text-zinc-500 uppercase mt-1">Ост.</span></div>
                                        <div className="flex flex-col items-center border-l border-white/5"><span className="text-sm font-bold text-emerald-400">{camp.paidOut}%</span><span className="text-[9px] text-zinc-500 uppercase mt-1">Выпл.</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <button onClick={() => openModal('directions', camp.id)} className="bg-[#27272a]/60 hover:bg-[#27272a]/90 border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95 group">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors"><FileText size={16} /></div>
                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">ТЗ и инфо</span>
                                        </button>
                                        <button onClick={() => openModal('posts', camp.id)} className="bg-[#27272a]/60 hover:bg-[#27272a]/90 border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95 group">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors"><LayoutList size={16} /></div>
                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">Мои посты</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => openModal('upload', camp.id)}
                                        className="w-full mt-auto bg-white text-black font-bold text-sm py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-zinc-200"
                                    >
                                        <Plus size={18} />
                                        Добавить ссылку на клип
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VERIFICATION BANNER */}
            <div className="relative z-10 w-full mb-8 px-1">
                <button
                    onClick={() => setActiveModal('verification')}
                    className="w-full relative group overflow-hidden rounded-[24px] shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-transform bg-zinc-900 glass-shine"
                >
                    <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none transition-colors group-hover:bg-black/30"></div>
                    <img
                        src="/images/starclip-code.png"
                        alt="Получить код верификации"
                        className="w-full h-auto object-cover relative z-10 scale-[1.25] group-hover:scale-[1.3] transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-auto">
                        <div className="bg-white text-black font-bold py-2 px-6 rounded-lg shadow-lg shadow-black/20 transform group-active:scale-95 transition-transform flex items-center justify-center text-sm whitespace-nowrap">
                            Получить код
                        </div>
                    </div>
                </button>
            </div>

            {/* VERIFICATION MODAL */}
            {activeModal === 'verification' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#18181b] w-full max-w-sm rounded-[32px] p-6 border border-white/10 relative overflow-hidden shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none"></div>

                        <button
                            onClick={() => setActiveModal(null)}
                            className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10 pt-4">

                            <h3 className="text-2xl font-bold text-white mb-3">Код автора</h3>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 text-left w-full">
                                <p className="text-sm text-blue-100 leading-relaxed font-medium">
                                    Только с этим кодом мы сможем подтвердить, что видео принадлежит вам, и начислить оплату.
                                </p>
                            </div>

                            <p className="text-sm text-zinc-400 mb-2">
                                Вставьте код в <strong>самый конец</strong> описания:
                            </p>

                            <div className="w-full bg-black/60 rounded-xl p-2 pl-4 border border-white/10 mb-8 flex items-center justify-between gap-2">
                                <code className="text-white font-mono font-bold text-lg tracking-wider truncate">
                                    {videos[0]?.verificationCode || '#SC-LOADING'}
                                </code>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const code = videos[0]?.verificationCode;
                                        if (code) {
                                            const copyToClipboard = (text: string) => {
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    navigator.clipboard.writeText(text).then(() => alert('Скопировано!'));
                                                } else {
                                                    const textArea = document.createElement("textarea");
                                                    textArea.value = text;
                                                    textArea.style.position = "fixed"; // Avoid scrolling to bottom
                                                    textArea.style.left = "0";
                                                    textArea.style.top = "0";
                                                    textArea.style.opacity = "0";
                                                    textArea.setAttribute("readonly", ""); // Prevent keyboard
                                                    document.body.appendChild(textArea);

                                                    // iOS hack
                                                    const range = document.createRange();
                                                    range.selectNodeContents(textArea);
                                                    const selection = window.getSelection();
                                                    if (selection) {
                                                        selection.removeAllRanges();
                                                        selection.addRange(range);
                                                    }
                                                    textArea.setSelectionRange(0, 999999); // For mobile

                                                    try {
                                                        document.execCommand('copy');
                                                        alert('Скопировано!');
                                                    } catch (err) {
                                                        console.error('Copy failed', err);
                                                        prompt('Скопируйте код вручную:', text);
                                                    }
                                                    document.body.removeChild(textArea);
                                                }
                                            };
                                            copyToClipboard(code);
                                        }
                                    }}
                                    className="px-4 py-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-white font-medium transition-colors text-sm whitespace-nowrap border border-white/5"
                                >
                                    Скопировать
                                </button>
                            </div>

                            <button
                                onClick={() => setActiveModal(null)}
                                className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-zinc-200 transition-colors active:scale-[0.98]"
                            >
                                Всё понятно
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full mb-6 flex items-center gap-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">История</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* 2. RECENT CLIPS (Accepted Only) */}
            <div className="relative z-10 mb-8 opacity-80 hover:opacity-100 transition-opacity">
                <h2 className="text-lg font-bold text-white mb-4 ml-1 text-center">Недавние принятые</h2>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mr-4 pr-4 snap-x">
                    {recentAcceptedVideos.length > 0 ? recentAcceptedVideos.map((clip) => (
                        <div key={clip.id} className="relative flex-shrink-0 w-[24vw] sm:w-[100px] aspect-[9/16] rounded-xl overflow-hidden snap-start shadow-lg group border-2 border-emerald-500/50">
                            <img src={clip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white">{clip.views}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-zinc-500 text-sm px-4">Нет недавних клипов</div>
                    )}
                </div>
            </div>


            {/* 3. CLIPS LIST */}
            <div className="relative z-10 opacity-90">


                {/* Filtered Video List */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mr-4 pr-4 snap-x">
                    {filteredVideos.map((video) => (
                        <button
                            key={video.id}
                            onClick={() => { setSelectedVideo(video); setActiveModal('videoDetail'); }}
                            className={`relative flex-shrink-0 w-[24vw] sm:w-[100px] aspect-[9/16] rounded-xl overflow-hidden snap-start shadow-lg group border-2 transition-all active:scale-95 ${video.status === 'processing' ? 'border-amber-500/50' :
                                video.status === 'rejected' ? 'border-red-500/50' : 'border-blue-500/50'
                                }`}
                        >
                            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                            <div className="absolute top-1.5 left-1.5">
                                {video.status === 'published' && <div className="bg-black/40 backdrop-blur-sm p-1 rounded-full text-emerald-400 border border-emerald-500/30"><CheckCircle2 size={10} /></div>}
                                {video.status === 'processing' && <div className="bg-black/40 backdrop-blur-sm p-1 rounded-full text-amber-400 border border-amber-500/30"><Clock size={10} className="animate-pulse" /></div>}
                                {video.status === 'rejected' && <div className="bg-black/40 backdrop-blur-sm p-1 rounded-full text-red-400 border border-red-500/30"><AlertTriangle size={10} /></div>}
                            </div>
                            <div className="absolute bottom-2 left-1.5 right-1.5 flex flex-col items-start text-left">
                                <h3 className="text-[9px] font-bold text-white leading-tight line-clamp-2 mb-1">{video.title}</h3>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[8px] text-zinc-400">{video.date}</span>
                                    {video.views !== '-' && <span className="text-[8px] text-zinc-300 font-medium">{video.views}</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                    {filteredVideos.length === 0 && <div className="text-zinc-500 text-sm px-2">Нет видео для отображения</div>}
                </div>
            </div>

            {/* --- MODALS --- */}
            {activeModal && activeModal !== 'verification' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>

                    <div className="relative w-full max-w-sm bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white z-20"><X size={24} /></button>

                        {/* UPLOAD MODAL */}
                        {activeModal === 'upload' && (
                            <div className="flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-2">Ссылка на клип</h3>
                                <p className="text-zinc-400 text-sm text-center mb-6">Вставьте ссылку на видео из TikTok, YouTube Shorts или Instagram Reels.</p>

                                <div className="w-full mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Link className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <input
                                            type="url"
                                            inputMode="url"
                                            autoFocus
                                            value={uploadLink}
                                            onChange={(e) => setUploadLink(e.target.value)}
                                            placeholder="https://..."
                                            className="block w-full pl-10 pr-3 py-4 border border-zinc-700 rounded-xl leading-5 bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Supported Platforms Icons */}
                                <div className="flex gap-4 mb-8 justify-center opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5"><Youtube size={20} className="text-red-500" /></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5"><Instagram size={20} className="text-pink-500" /></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5"><Music2 size={20} className="text-cyan-400" /></div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadLink || isSubmitting}
                                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${uploadLink && !isSubmitting
                                        ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                    ) : (
                                        <>
                                            Отправить на проверку
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* CONNECT ACCOUNT MODAL */}
                        {activeModal === 'connect' && (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-6">Подключить аккаунт</h3>
                                <div className="space-y-3">
                                    <button onClick={() => handleConnectAccount('youtube')} className="w-full p-4 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-between transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><Youtube className="text-red-500" size={18} /></div>
                                            <span className="font-medium text-white">YouTube</span>
                                        </div>
                                        <Plus size={18} className="text-zinc-500 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => handleConnectAccount('instagram')} className="w-full p-4 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-between transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center"><Instagram className="text-pink-500" size={18} /></div>
                                            <span className="font-medium text-white">Instagram</span>
                                        </div>
                                        <Plus size={18} className="text-zinc-500 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => handleConnectAccount('tiktok')} className="w-full p-4 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-between transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center"><Music2 className="text-cyan-400" size={18} /></div>
                                            <span className="font-medium text-white">TikTok</span>
                                        </div>
                                        <Plus size={18} className="text-zinc-500 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VIDEO DETAIL + AI REPORT MODAL */}
                        {activeModal === 'videoDetail' && selectedVideo && (
                            <div>
                                {/* Status Header */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${selectedVideo.status === 'published' ? 'bg-emerald-500' :
                                    selectedVideo.status === 'processing' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}></div>

                                <h3 className="text-lg font-bold text-white mb-1 pr-6 truncate">{selectedVideo.title}</h3>
                                <p className="text-xs text-zinc-500 mb-6">{selectedVideo.date}</p>

                                {/* Stats Card */}
                                <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-black/40 rounded-lg p-3 text-center border border-white/5">
                                            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Просмотры</div>
                                            <div className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
                                                <Play size={14} className="text-white fill-white" />
                                                {selectedVideo.views}
                                            </div>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-3 text-center border border-white/5">
                                            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Заработано</div>
                                            <div className="text-xl font-bold text-emerald-400">
                                                {selectedVideo.earnedAmount?.toFixed(2) || '0.00'} ₽
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${selectedVideo.isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500 animate-pulse'}`}></div>
                                            <span className={`text-xs font-medium ${selectedVideo.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {selectedVideo.isVerified ? 'Верифицирован' : 'Ожидает проверки хэштега'}
                                            </span>
                                        </div>
                                        {!selectedVideo.isVerified && selectedVideo.verificationCode && (
                                            <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono select-all">
                                                {selectedVideo.verificationCode}
                                            </span>
                                        )}
                                    </div>

                                    {/* Error State */}
                                    {selectedVideo.status === 'rejected' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-400 mb-0.5">Клип отклонён</p>
                                                    <p className="text-xs text-zinc-300 leading-snug">{selectedVideo.aiData?.rejectionReason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Support Action */}
                                {selectedVideo.status === 'rejected' && (
                                    <button
                                        onClick={handleAppeal}
                                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 border border-white/5"
                                    >
                                        <MessageCircle size={16} />
                                        Оспорить решение (Поддержка)
                                    </button>
                                )}
                            </div>
                        )}

                        {/* DIRECTIONS MODAL */}
                        {activeModal === 'directions' && getSelectedCampaign() && (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="text-blue-500" size={20} />ТЗ</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed mb-6">{getSelectedCampaign()?.description}</p>
                                <a
                                    href={getSelectedCampaign()?.assetsLink || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#27272a] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3f3f46] transition-colors"
                                >
                                    <Download size={18} />Материалы
                                </a>
                            </div>
                        )}

                        {/* POSTS MODAL */}
                        {activeModal === 'posts' && (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4"><LayoutList className="text-purple-500 inline mr-2" size={20} />Мои посты</h3>
                                {videos.filter(v => v.campaignId === selectedCampaignId).length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {videos.filter(v => v.campaignId === selectedCampaignId).map(video => (
                                            <div key={video.id} className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg">
                                                <img src={video.thumbnailUrl} alt="" className="w-12 h-12 rounded object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{video.title}</p>
                                                    <p className="text-xs text-zinc-500">{video.date} • {video.views} просм.</p>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${video.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    video.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {video.status === 'published' ? 'Принят' : video.status === 'processing' ? 'Проверка' : 'Отклонён'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-zinc-500 py-4">Вы ещё не добавили клипы для этой кампании.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
