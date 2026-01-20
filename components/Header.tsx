import React from 'react';

export const Header: React.FC = () => {
  return (
    <div
      className="w-full pt-10 pb-2 flex justify-center relative z-10 pointer-events-none"
      style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))' }}
    >
      <header>
        <h1 className="text-2xl font-bold text-white tracking-normal drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
          StarClip
        </h1>
      </header>
    </div>
  );
};