import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsViewProps {
    onBack: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
    return (
        <div
            className="w-full min-h-screen bg-[#09090b] text-white px-4 pb-24 animate-in fade-in duration-300 relative z-20"
            style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))' }}
        >

            <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
            <p className="text-zinc-500 text-sm mb-8">Last updated: 23 January 2026</p>

            <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
                    <p>
                        StarClip ("we", "our", "Service") is a platform that helps content creators (streamers, YouTubers, influencers) create, manage and publish short-form videos (clips) to social platforms including TikTok, YouTube Shorts and Instagram Reels.
                        <br /><br />
                        By using StarClip, you agree to these Terms of Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">2. Eligibility</h2>
                    <p>
                        You must be at least 13 years old (or the minimum age required in your country) to use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">3. Service Description</h2>
                    <p>StarClip provides:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>tools to upload and manage video materials,</li>
                        <li>creation of short clips (editing/formatting),</li>
                        <li>publishing to connected social accounts (where available),</li>
                        <li>collaboration between creators and video editors ("clippers").</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">4. User Accounts and Access</h2>
                    <p>
                        You are responsible for maintaining the security of your account and any connected third-party accounts (including TikTok).
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">5. Content and Rights</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>You retain ownership of your content.</li>
                        <li>By uploading content to StarClip, you grant us a limited license to process, edit, store and publish it only for the purpose of providing the Service.</li>
                        <li>You confirm that you have the necessary rights to upload and publish the content.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">6. Prohibited Activities</h2>
                    <p>You agree not to use StarClip to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>publish illegal, harmful, or infringing content,</li>
                        <li>violate platform rules (including TikTok policies),</li>
                        <li>impersonate others or mislead users,</li>
                        <li>attempt unauthorized access or abuse the Service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">7. Payments and Refunds</h2>
                    <p>
                        If StarClip provides paid services, pricing and billing terms will be shown before purchase. Refunds may be provided according to the refund policy displayed in the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">8. Third-Party Services</h2>
                    <p>
                        StarClip may integrate with third-party services (e.g., TikTok). We are not responsible for third-party platforms, their availability, or their actions.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
                    <p>
                        We may suspend or terminate access to the Service if you violate these Terms or applicable laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">10. Disclaimer</h2>
                    <p>
                        StarClip is provided "as is". We do not guarantee specific growth, reach, or performance results.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
                    <p>
                        For support and legal inquiries:<br />
                        Email: <a href="mailto:support@starclip.app" className="text-blue-400 hover:underline">support@starclip.app</a>
                    </p>
                </section>
            </div>
        </div>
    );
};
