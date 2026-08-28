"use client";

import React from "react";
import { DomainKey, DOMAIN_LABELS } from "../types";

interface DomainBannerProps {
  activeDomainFilter?: string;
  onSelectDomain?: (domain: string) => void;
}

export const DomainBanner: React.FC<DomainBannerProps> = ({
  activeDomainFilter,
  onSelectDomain,
}) => {
  const domains: Array<{
    key: DomainKey;
    icon: string;
    description: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;
  }> = [
    {
      key: "hr_employment",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      description: "Resumes, Offer Letters, Pay Stubs",
      accentBg: "bg-amber-500/10",
      accentBorder: "border-amber-500/30",
      accentText: "text-amber-400",
    },
    {
      key: "identity_kyc",
      icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6",
      description: "Passports, IDs, Driver Licenses",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/30",
      accentText: "text-cyan-400",
    },
    {
      key: "billing_finance",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      description: "Utility Bills, Invoices, Receipts",
      accentBg: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/30",
      accentText: "text-emerald-400",
    },
    {
      key: "education_academics",
      icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
      description: "Diplomas, Transcripts, Certs",
      accentBg: "bg-purple-500/10",
      accentBorder: "border-purple-500/30",
      accentText: "text-purple-400",
    },
    {
      key: "legal_contracts",
      icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 0L9 3m3 2l3-2",
      description: "Leases, Deeds, Affidavits",
      accentBg: "bg-rose-500/10",
      accentBorder: "border-rose-500/30",
      accentText: "text-rose-400",
    },
    {
      key: "medical_insurance",
      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      description: "Health Records, Claim Reports",
      accentBg: "bg-blue-500/10",
      accentBorder: "border-blue-500/30",
      accentText: "text-blue-400",
    },
  ];

  return (
    <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Universal Multi-Domain Forensic Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated verification portal tailored for HR, KYC Identity, Billing, Academics, Legal & Healthcare
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accepts PDF, DOCX, PNG, JPG, CSV, ZIP, TXT & More
        </span>
      </div>

      {/* Domain Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {domains.map((d) => {
          const isSelected = activeDomainFilter === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDomain && onSelectDomain(isSelected ? "all" : d.key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? `${d.accentBg} ${d.accentBorder} ring-2 ring-cyan-500/50 shadow-lg`
                  : `bg-slate-950/60 border-slate-800/80 hover:${d.accentBg} hover:${d.accentBorder}`
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${d.accentBg} ${d.accentText}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d.icon} />
                </svg>
              </div>
              <span className={`text-xs font-bold block uppercase tracking-tight ${d.accentText}`}>
                {DOMAIN_LABELS[d.key]}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                {d.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
