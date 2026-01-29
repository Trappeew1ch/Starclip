import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyViewProps {
    onBack: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
    return (
        <div
            className="w-full min-h-screen bg-[#09090b] text-white px-4 pb-24 animate-in fade-in duration-300 relative z-20"
            style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))' }}
        >

            <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm mb-8">Last updated: 23 January 2026</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">1. Overview</h2>
                    <p>
                        This Privacy Policy explains how StarClip collects, uses and protects your information.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
                    <p>We may collect:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>account information (name, email, username),</li>
                        <li>technical data (IP, device, browser, logs),</li>
                        <li>content you upload (videos, titles, descriptions),</li>
                        <li>connected social account data (e.g., TikTok account identifier and authorization tokens, where applicable).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Information</h2>
                    <p>We use data to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>provide and improve StarClip services,</li>
                        <li>enable publishing and integration features,</li>
                        <li>maintain security and prevent abuse,</li>
                        <li>communicate with users (support and notifications).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">4. TikTok Data</h2>
                    <p>
                        If you connect your TikTok account, StarClip may access data required to publish content and manage integration.
                        <br />
                        We only use this data to provide requested functionality and do not sell it.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">5. Data Sharing</h2>
                    <p>
                        We do not sell your personal data.
                        <br />
                        We may share information only with:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>service providers (hosting, analytics, storage) to operate StarClip,</li>
                        <li>third-party platforms (TikTok) when you publish content,</li>
                        <li>legal authorities if required by law.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
                    <p>
                        We keep your data only as long as necessary to provide the Service or comply with legal obligations. You may request deletion.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">7. Security</h2>
                    <p>
                        We implement reasonable security measures to protect your information, but no system is 100% secure.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
                    <p>Depending on your location, you may have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>access your data,</li>
                        <li>correct or delete your data,</li>
                        <li>withdraw consent for certain processing.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">9. Contact</h2>
                    <p>
                        Privacy requests:<br />
                        Email: <a href="mailto:privacy@starclip.app" className="text-blue-400 hover:underline">privacy@starclip.app</a>
                    </p>
                </section>
            </div>
        </div>
    );
};
