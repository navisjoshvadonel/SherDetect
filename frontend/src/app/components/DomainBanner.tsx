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
    bgColor: string;
  }> = [
    {
      key: "hr_employment",
      icon: "fa-solid fa-file-user",
      description: "CV, Offer Letter, Experience",
      bgColor: "bg-brutal-yellow/20",
    },
    {
      key: "identity_kyc",
      icon: "fa-solid fa-address-card",
      description: "Passport, DL, National ID",
      bgColor: "bg-brutal-cyan/20",
    },
    {
      key: "billing_finance",
      icon: "fa-solid fa-file-invoice-dollar",
      description: "Utility Bills, Receipts, Tax",
      bgColor: "bg-brutal-pink/20",
    },
    {
      key: "education_academics",
      icon: "fa-solid fa-graduation-cap",
      description: "Diploma, Transcripts, Certs",
      bgColor: "bg-brutal-green/20",
    },
    {
      key: "legal_contracts",
      icon: "fa-solid fa-scale-balanced",
      description: "Deeds, Leases, Agreements",
      bgColor: "bg-brutal-purple/20",
    },
    {
      key: "medical_insurance",
      icon: "fa-solid fa-notes-medical",
      description: "Health Records, Claims",
      bgColor: "bg-brutal-orange/20",
    },
  ];

  return (
    <section className="neo-card p-6 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b-3 border-brutal-black pb-3">
        <div>
          <h2 className="text-xl font-black text-brutal-black flex items-center gap-2 uppercase tracking-wide">
            <span className="w-4 h-4 bg-brutal-purple inline-block border-2 border-brutal-black"></span>
            Universal Multi-Domain Verification Suite
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            Verification portal tailored for HR, Personal Identity, Billing, Academics, Legal &amp; Healthcare
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-black text-brutal-black bg-brutal-green border-2 border-brutal-black px-3.5 py-1 rounded-lg shadow-brutal-sm">
          <i className="fa-solid fa-file-circle-check"></i>
          Accepts PDF, DOCX, PNG, JPG, CSV, ZIP, TXT &amp; More
        </span>
      </div>

      {/* Domain Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {domains.map((d) => {
          const isSelected = activeDomainFilter === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDomain && onSelectDomain(isSelected ? "all" : d.key)}
              className={`p-3.5 ${d.bgColor} border-2 border-brutal-black rounded-xl text-center shadow-brutal-sm transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "ring-3 ring-brutal-black bg-brutal-yellow translate-y-[-2px]"
                  : "hover:translate-y-[-2px] hover:shadow-brutal"
              }`}
            >
              <i className={`${d.icon} text-xl text-brutal-black mb-1.5 block`}></i>
              <span className="text-xs font-black uppercase text-brutal-black block">
                {DOMAIN_LABELS[d.key]}
              </span>
              <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
                {d.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
