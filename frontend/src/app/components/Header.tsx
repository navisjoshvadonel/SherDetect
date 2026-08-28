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
    <header className="sticky top-0 z-40 bg-white border-b-3 border-brutal-black px-4 lg:px-8 py-2.5 shadow-brutal">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brutal-yellow border-2.5 border-brutal-black shadow-brutal-sm rounded-xl flex items-center justify-center text-lg font-extrabold transition-transform hover:rotate-6">
            <i className="fa-solid fa-shield-halved text-brutal-black"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-brutal-black uppercase">
                VERIFY
                <span className="bg-brutal-yellow px-1.5 py-0.5 border-2 border-brutal-black rounded ml-1 shadow-brutal-sm">
                  HUB
                </span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brutal-cyan border-2 border-brutal-black shadow-brutal-sm">
                Universal Platform
              </span>
            </div>
            <p className="text-[11px] font-extrabold text-slate-700">
              Multi-Domain Verification Engine &bull; Resumes, Bills, IDs, Credentials &amp; Legal
            </p>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="flex items-center bg-brutal-bg p-1.5 rounded-xl border-2.5 border-brutal-black shadow-brutal-sm gap-2">
          <span className="text-[11px] font-black text-brutal-black px-1.5 hidden sm:flex items-center gap-1">
            <i className="fa-solid fa-sliders text-brutal-purple me-1"></i>
            ROLE:
          </span>

          <button
            type="button"
            onClick={() => onRoleChange("customer")}
            className={`neo-btn px-3.5 py-1.5 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "customer"
                ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm scale-102"
                : "bg-white text-brutal-black hover:bg-slate-50"
            }`}
          >
            <i className="fa-solid fa-user me-1 text-slate-800"></i>
            Submitter View
          </button>

          <button
            type="button"
            onClick={() => onRoleChange("officer")}
            className={`neo-btn px-3.5 py-1.5 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "officer"
                ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm scale-102"
                : "bg-white text-brutal-black hover:bg-slate-50"
            }`}
          >
            <i className="fa-solid fa-user-check me-1 text-slate-800"></i>
            Verifier / Reviewer View
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border border-brutal-black shadow-brutal-sm transition-all ${
                pendingCount > 0
                  ? "bg-brutal-pink text-white animate-pulse"
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
