import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
  onSwitchToPrivacy?: () => void;
}

export const TermsAndConditions: React.FC<LegalPageProps> = ({ onBack, onSwitchToPrivacy }) => {
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
        {onSwitchToPrivacy && (
          <button
            type="button"
            onClick={onSwitchToPrivacy}
            className="font-mono text-xs uppercase font-bold text-[#ff4d00] hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Read Privacy Policy
          </button>
        )}
      </div>

      <article className="border-2 border-[#1a1a1a] bg-white p-6 md:p-10 shadow-[4px_4px_0_#1a1a1a] space-y-8">
        <header className="border-b-2 border-[#1a1a1a] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-[#ff4d00] font-mono text-xs uppercase font-bold tracking-widest">
            <FileText className="w-4 h-4" />
            Legal Documentation
          </div>
          <h1 className="font-oswald text-4xl uppercase font-bold text-[#1a1a1a]">
            Terms &amp; Conditions
          </h1>
          <p className="font-mono text-xs text-[#1a1a1a]/60">
            Effective Date: November 20, 2026 | Domain: flexpulse.app
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            1. Acceptance of Terms
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            By accessing or using FlexPulse (flexpulse.app), creating an account, or logging training sessions, you agree to be bound by these Terms &amp; Conditions. If you do not agree to these terms, discontinue use of the application immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            2. Health &amp; Training Disclaimer
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            FlexPulse is a workout logging and strength progression utility, not a medical service or certified coaching provider. Strength training carries inherent physical risks. Consult a qualified physician before beginning any resistance program, especially if you have pre-existing cardiovascular, orthopedic, or metabolic conditions. Calculated metrics such as Estimated 1RM (Epley formula), BMI, FFMI, and Waist-to-Height Ratio are informational estimates only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            3. User Accounts &amp; Security
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all workout logs, custom routines, and profile metrics recorded under your account. Accounts must use valid, non-abusive usernames and strong passwords meeting minimum complexity standards. Unauthorized automated scraping, credential stuffing, or attempts to access another user's records are strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            4. Acceptable Use &amp; User Content
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            You retain ownership of the workout logs, custom routines, bios, and profile images you upload. You agree not to upload malicious payloads, executable scripts, oversized files, or unlawful content. FlexPulse reserves the right to sanitize input fields, enforce upload limits, and suspend accounts that compromise platform stability or security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            5. Availability &amp; Limitation of Liability
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            FlexPulse is provided on an "as is" and "as available" basis without warranties of any kind. To the maximum extent permitted by law, FlexPulse and its operators are not liable for any physical injury, data loss, or service interruption resulting from the use of this platform.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#1a1a1a]/20 pt-6">
          <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">
            6. Contact &amp; Updates
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/80 leading-relaxed">
            We may update these Terms &amp; Conditions periodically. Continued use of FlexPulse after updates take effect constitutes acceptance of the revised terms. For account or legal inquiries, contact support@flexpulse.app.
          </p>
        </section>
      </article>
    </div>
  );
};
