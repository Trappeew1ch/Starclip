import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b]"
            style={{
                backgroundImage: `url('/images/loading-new.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Loading spinner positioned higher */}
            <div className="absolute" style={{ top: '53%' }}>
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 w-12 h-12 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>

                    {/* Spinner */}
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );
};
