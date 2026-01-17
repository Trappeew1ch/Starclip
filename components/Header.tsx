import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="w-full py-6 flex justify-center relative z-10 pointer-events-none">
        <header>
            <h1 className="text-xl font-bold text-white tracking-normal drop-shadow-lg">
                StarClip
            </h1>
        </header>
    </div>
  );
};