"use client";

import React from "react";
import { DomainKey, DOMAIN_LABELS } from "../types";

interface DomainBannerProps {
  activeDomainFilter?: string;
  onSelectDomain?: (domain: string) => void;
}

export const DomainBanner: React.FC<DomainBannerProps> = ({
  activeDomainFilter = "all",
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
    <section className="neo-card p-3 md:p-3.5 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2.5 border-b-2.5 border-brutal-black pb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-brutal-purple inline-block border-2 border-brutal-black rounded-sm animate-pulse"></span>
          <h2 className="text-sm font-black text-brutal-black uppercase tracking-wide flex items-center gap-1.5">
            SherDetect Multi-Domain Verification Suite
          </h2>
          {activeDomainFilter !== "all" ? (
            <span className="text-[10.5px] font-black bg-brutal-yellow text-brutal-black px-2 py-0.5 border-2 border-brutal-black rounded shadow-brutal-sm flex items-center gap-1 animate-toast">
              Filtered: {DOMAIN_LABELS[activeDomainFilter as DomainKey] || activeDomainFilter}
              <button
                onClick={() => onSelectDomain && onSelectDomain("all")}
                className="ml-1 hover:text-red-600 text-xs font-black"
                title="Clear Filter"
              >
                &times;
              </button>
            </span>
          ) : (
            <span className="text-[9.5px] font-black bg-brutal-bg text-slate-700 px-2 py-0.5 border border-brutal-black rounded">
              ALL DOMAINS ACTIVE
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-brutal-black bg-brutal-green border-2 border-brutal-black px-2.5 py-0.5 rounded-lg shadow-brutal-sm">
          <i className="fa-solid fa-shield-check text-xs text-brutal-black"></i>
          Supports PDF, DOCX, PNG, JPG, CSV, ZIP &amp; TXT
        </span>
      </div>

      {/* Domain Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {domains.map((d) => {
          const isSelected = activeDomainFilter === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDomain && onSelectDomain(isSelected ? "all" : d.key)}
              className={`group p-2 ${d.bgColor} border-2 border-brutal-black rounded-xl text-center shadow-brutal-sm transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "ring-3 ring-brutal-black bg-brutal-yellow -translate-y-1 shadow-brutal scale-102"
                  : "hover:-translate-y-1 hover:shadow-brutal hover:scale-[1.02]"
              }`}
            >
              <i className={`${d.icon} text-base text-brutal-black mb-1 block transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`}></i>
              <span className="text-[10.5px] font-black uppercase text-brutal-black block truncate">
                {DOMAIN_LABELS[d.key]}
              </span>
              <span className="text-[9px] font-bold text-slate-700 block truncate mt-0.5">
                {d.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
