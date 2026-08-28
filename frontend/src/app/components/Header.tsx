"use client";

import React from "react";

interface HeaderProps {
  currentRole: "customer" | "officer";
  onRoleChange: (role: "customer" | "officer") => void;
  pendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  pendingCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b-3 border-brutal-black px-4 lg:px-8 py-2 shadow-brutal">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-brutal-yellow border-2.5 border-brutal-black shadow-brutal-sm rounded-xl flex items-center justify-center text-lg font-extrabold transition-all duration-300 hover:rotate-12 hover:scale-110">
            <i className="fa-solid fa-magnifying-glass-chart text-brutal-black animate-icon-pop"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-brutal-black uppercase">
                SHER
                <span className="bg-brutal-yellow px-1.5 py-0.5 border-2 border-brutal-black rounded ml-1 shadow-brutal-sm">
                  DETECT
                </span>
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brutal-cyan border-2 border-brutal-black shadow-brutal-sm flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-brutal-black"></i>
                AI Forensics Suite
              </span>
            </div>
            <p className="text-[10.5px] font-extrabold text-slate-700">
              Autonomous Multi-Domain Document Forensic &amp; Verification Engine &bull; Resumes, Bills, IDs, Credentials &amp; Legal
            </p>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="flex items-center bg-brutal-bg p-1 rounded-xl border-2.5 border-brutal-black shadow-brutal-sm gap-1.5">
          <span className="text-[10.5px] font-black text-brutal-black px-1.5 hidden sm:flex items-center gap-1">
            <i className="fa-solid fa-sliders text-brutal-purple me-1"></i>
            ROLE:
          </span>

          <button
            type="button"
            onClick={() => onRoleChange("customer")}
            className={`neo-btn px-3 py-1 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "customer"
                ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm scale-102"
                : "bg-white text-brutal-black hover:bg-slate-50 hover:scale-102"
            }`}
          >
            <i className="fa-solid fa-user me-1 text-brutal-black"></i>
            Submitter View
          </button>

          <button
            type="button"
            onClick={() => onRoleChange("officer")}
            className={`neo-btn px-3 py-1 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "officer"
                ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm scale-102"
                : "bg-white text-brutal-black hover:bg-slate-50 hover:scale-102"
            }`}
          >
            <i className="fa-solid fa-user-check me-1 text-brutal-black"></i>
            Verifier / Reviewer View
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-black border border-brutal-black shadow-brutal-sm transition-all ${
                pendingCount > 0
                  ? "bg-brutal-pink text-white animate-badge-pulse"
                  : "bg-brutal-green text-brutal-black"
              }`}
            >
              {pendingCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
