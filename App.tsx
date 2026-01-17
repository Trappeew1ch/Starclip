import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { OfferSection } from './components/OfferSection';
import { BottomNav } from './components/BottomNav';
import { EarningsView } from './components/EarningsView';
import { ClipsView } from './components/ClipsView';
import { OfferDetailsView } from './components/OfferDetailsView';
import { BannerSlide, ViewType } from './types';

const banners: BannerSlide[] = [
  {
    id: '1',
    title: 'Наш Telegram канал',
    subtitle: 'Новости и апдейты',
    imageUrl: 'https://i.postimg.cc/YSxXfg3B/Plaska-nas-tg-kanal-kopia.png',
    buttonText: 'Join',
    link: 'https://t.me/StarClip_channel'
  }
];

function AppContent() {
  const { offers, campaigns, loadOffers, loadCampaigns, joinCampaign, isLoading, user } = useApp();

  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  // Load offers on mount
  useEffect(() => {
    loadOffers();
    loadCampaigns();
  }, []);

  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setCurrentView('offer-details');
  };

  const handleBack = () => {
    setSelectedOffer(null);
    setCurrentView('home');
  };

  const handleJoinCampaign = async (offer: any) => {
    const success = await joinCampaign(offer.id);
    if (success) {
      setCurrentView('offers');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <main className="relative z-10 flex flex-col items-center w-full px-4 animate-in fade-in duration-300">
            <Banner slides={banners} />
            <OfferSection offers={offers} onOfferClick={handleOfferClick} />
          </main>
        );
      case 'earnings':
        return <EarningsView />;
      case 'offers':
        return <ClipsView campaigns={campaigns} />;
      case 'offer-details':
        if (!selectedOffer) return null;
        return <OfferDetailsView offer={selectedOffer} onBack={handleBack} onJoin={() => handleJoinCampaign(selectedOffer)} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center text-white font-sans selection:bg-sky-500/30 bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: `url('https://i.imgur.com/wZnamXv.jpeg')`,
        backgroundColor: '#09090b'
      }}
    >
      <div className="fixed inset-0 bg-black/10 pointer-events-none z-0"></div>

      <div className="w-full max-w-md relative pb-0 z-10">
        {currentView === 'home' && <Header />}

        {renderContent()}

        {currentView !== 'offer-details' && (
          <BottomNav currentView={currentView} onNavigate={setCurrentView} isAdmin={user?.isAdmin} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
