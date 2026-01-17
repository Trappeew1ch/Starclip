import React from 'react';
import { BannerSlide } from '../types';

interface BannerProps {
  slides: BannerSlide[];
}

export const Banner: React.FC<BannerProps> = ({ slides }) => {
  const currentSlide = slides[0];
  if (!currentSlide) return null;

  const handleBannerClick = () => {
    // Open link in Telegram or browser
    const link = currentSlide.link || 'https://t.me/StarClip_channel';
    if (typeof window !== 'undefined') {
      // Try to open in Telegram app first
      const tg = (window as any).Telegram?.WebApp;
      if (tg && link.startsWith('https://t.me/')) {
        tg.openTelegramLink(link);
      } else {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <div className="w-full mb-3 relative">
      {/* Uneven Bright Glow Underneath */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-[-1]">
        {/* Main blue glow */}
        <div className="absolute top-4 left-0 w-[80%] h-[80%] bg-blue-600 blur-[60px] opacity-60"></div>
        {/* Bright Cyan accent for unevenness */}
        <div className="absolute -bottom-4 -right-4 w-[60%] h-[60%] bg-cyan-500 blur-[50px] opacity-50"></div>
      </div>

      {/* Container - clickable */}
      <button
        onClick={handleBannerClick}
        className="relative w-full glass-panel rounded-[1.8rem] p-1 overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
      >
        {/* Inner Content - No Text, Zoomed Image */}
        <div className="relative w-full aspect-[745/178] overflow-hidden rounded-[1.6rem] bg-zinc-900/50">
          {/* Background Image - Scaled Up */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90 scale-110"
            style={{
              backgroundImage: `url(${currentSlide.imageUrl})`
            }}
          />
          {/* Slight overlay for contrast */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
      </button>
    </div>
  );
};