import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { OfferSection } from './components/OfferSection';
import { BottomNav } from './components/BottomNav';
import { EarningsView } from './components/EarningsView';
import { ClipsView } from './components/ClipsView';
import { OfferDetailsView } from './components/OfferDetailsView';
import { TermsView } from './components/TermsView';
import { PrivacyView } from './components/PrivacyView';
import { AdminView } from './components/AdminView';
import { LoadingScreen } from './components/LoadingScreen';
import { ReferralView } from './components/ReferralView';
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
  const [appReady, setAppReady] = useState(false);

  // Load offers on mount
  useEffect(() => {
    loadOffers();

    // Check URL for direct navigation
    const path = window.location.pathname;
    if (path === '/terms') setCurrentView('terms');
    else if (path === '/privacy') setCurrentView('privacy');
  }, []);

  // Load user-specific data when authenticated
  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  // Show loading screen until data is loaded
  useEffect(() => {
    if (!isLoading) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setAppReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setCurrentView('offer-details');
  };

  const handleBack = () => {
    setSelectedOffer(null);
    setCurrentView('home');
  };

  // Manage Telegram Back Button
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Show/Hide Back Button based on view
    if (currentView !== 'home') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    // Cleanup listener on effect re-run (view change)
    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [currentView]);

  const handleJoinCampaign = async (offer: any) => {
    const success = await joinCampaign(offer.id);
    if (success) {
      setCurrentView('offers');
    }
  };

  // Show loading screen while app initializes
  if (!appReady) {
    return <LoadingScreen />;
  }

  const renderContent = () => {

    switch (currentView) {
      case 'home':
        return (
          <main className="relative z-10 flex flex-col items-center w-full px-4 animate-in fade-in duration-300">
            <Banner slides={banners} />
            <OfferSection offers={offers} onOfferClick={handleOfferClick} />
          </main>
        );
      case 'earnings':
        return <EarningsView onNavigate={setCurrentView} />;
      case 'offers':
        return <ClipsView campaigns={campaigns} />;
      case 'offer-details':
        if (!selectedOffer) return null;
        return <OfferDetailsView offer={selectedOffer} onBack={handleBack} onJoin={() => handleJoinCampaign(selectedOffer)} />;
      case 'terms':
        return <TermsView onBack={handleBack} />;
      case 'privacy':
        return <PrivacyView onBack={handleBack} />;
      case 'referral':
        return <ReferralView onBack={() => setCurrentView('earnings')} />;
      case 'admin':
        return <AdminView />;
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
        {!['offer-details', 'terms', 'privacy', 'referral'].includes(currentView) && (
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
