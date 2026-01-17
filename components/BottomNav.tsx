import React from 'react';
import { Home, Briefcase, RussianRuble, Shield } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
    currentView: ViewType;
    onNavigate: (view: ViewType) => void;
    isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, isAdmin }) => {
    const handleAdminClick = () => {
        // Open admin panel in new window or same window
        window.location.href = '/admin/';
    };

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
                    {isAdmin && (
                        <NavItem
                            icon={<Shield size={20} />}
                            label="Админ"
                            active={false}
                            onClick={handleAdminClick}
                            isAdmin
                        />
                    )}
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
    isAdmin?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isAdmin }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${isAdmin
                    ? 'text-amber-400 hover:text-amber-300'
                    : active
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                }`}
        >
            <div className={`p-1 rounded-2xl transition-all ${isAdmin
                    ? 'bg-amber-500/20'
                    : active
                        ? 'bg-white/10 -translate-y-1'
                        : ''
                }`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${isAdmin
                    ? 'text-amber-400'
                    : active
                        ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'
                        : 'text-zinc-600'
                }`}>
                {label}
            </span>
        </button>
    )
}