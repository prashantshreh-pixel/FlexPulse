import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
  onSwitchToTerms?: () => void;
}

export const PrivacyPolicy: React.FC<LegalPageProps> = ({ onBack, onSwitchToTerms }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-[#1a1a1a]/70 hover:text-[#ff4d00] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to FlexPulse
        </button>
        {onSwitchToTerms && (
          <button
            type="button"
            onClick={onSwitchToTerms}
            className="font-mono text-xs uppercase font-bold text-[#ff4d00] hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Read Terms &amp; Conditions
          </button>
        )}
      </div>

      <article className="border-2 border-[#1a1a1a] bg-white p-6 md:p-10 shadow-[4px_4px_0_#1a1a1a] space-y-8">
        <header className="border-b-2 border-[#1a1a1a] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-[#ff4d00] font-mono text-xs uppercase font-bold tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Data Protection
          </div>
          <h1 className="font-oswald text-4xl uppercase font-bold text-[#1a1a1a]">
            Privacy Policy
          </h1>
          <p className="font-mono text-xs text-[#1a1a1a]/60">
            Effective Date: November 20, 2026 | Domain: flexpulse.app
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            1. Information We Collect
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            FlexPulse collects only the data strictly required to run your workout tracking account: your username, optional email address, securely hashed password, workout session logs (exercises, sets, weights, reps, RPE, duration), personal records, and optional profile preferences or body measurements (height, weight, body fat percentage, circumference metrics, bio, and uploaded avatar or cover images).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            2. How We Use Your Data
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            Your training data is used exclusively to display your workout history, detect new Personal Records, compute session volume and fitness analytics (BMI, FFMI, Waist-to-Height Ratio), and persist your active training splits across sessions. We do not sell, rent, or trade your personal or fitness data to third-party advertisers or data brokers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            3. Browser Storage &amp; Authentication Tokens
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            FlexPulse uses browser localStorage to store your authentication token, active workout draft, unit preference (LBS/KG), theme preference (Light/Dark), and custom routine templates so your active session survives accidental page refreshes. Logging out clears your session token and active workout cache from the browser.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            4. Security Safeguards
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            Passwords are hashed using salted PBKDF2/Scrypt cryptographic hashers and are never stored or transmitted in plaintext after authentication. All API routes enforce strict user ownership checks, rate limiting, input sanitization, strict CORS allowlists, and defensive HTTP security headers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            5. Your Rights &amp; Data Control
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            You can view, edit, or clear your profile details and body measurements directly from the Profile view at any time. To request full account deletion or an export of your stored workout logs, contact privacy@flexpulse.app.
          </p>
        </section>
      </article>
    </div>
  );
};
