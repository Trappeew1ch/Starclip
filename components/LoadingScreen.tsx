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
            {/* Loading Progress Bar positioned at 53% - Pure White, No Text */}
            <div className="absolute w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm" style={{ top: '53%' }}>
                <div className="h-full bg-white rounded-full animate-[loading_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(255,255,255,0.6)]"></div>
            </div>

            <style>{`
                @keyframes loading {
                    0% { width: 0%; opacity: 0.5; }
                    50% { width: 70%; opacity: 1; }
                    100% { width: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};
