import React from 'react';
import { Home, Briefcase, RussianRuble } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
    currentView: ViewType;
    onNavigate: (view: ViewType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
      <div className="glass-panel rounded-[2rem] px-2 py-3 bg-[#09090b]/80 backdrop-blur-md">
        <div className="flex justify-between items-center h-12">
            <NavItem 
                icon={<Home size={20} />} 
                label="Главная" 
                active={currentView === 'home'} 
                onClick={() => onNavigate('home')}
            />
            <NavItem 
                icon={<Briefcase size={20} />} 
                label="Клипы" 
                active={currentView === 'offers'} 
                onClick={() => onNavigate('offers')}
            />
            <NavItem 
                icon={<RussianRuble size={20} />} 
                label="Заработок" 
                active={currentView === 'earnings'} 
                onClick={() => onNavigate('earnings')}
            />
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
            <div className={`p-1 rounded-2xl transition-all ${active ? 'bg-white/10 -translate-y-1' : ''}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-zinc-600'}`}>
                {label}
            </span>
        </button>
    )
}