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
            {/* Loading Progress Bar positioned at 53% */}
            <div className="absolute w-[200px] flex flex-col items-center gap-3" style={{ top: '53%' }}>
                {/* Progress Track */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    {/* Progress Fill */}
                    <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 rounded-full animate-[loading_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <p className="text-xs text-blue-400/80 font-mono tracking-widest animate-pulse">LOADING...</p>
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
