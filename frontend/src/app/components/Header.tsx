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
    <header className="sticky top-0 z-40 bg-white border-b-4 border-brutal-black px-4 lg:px-8 py-4 shadow-brutal">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-brutal-yellow border-3 border-brutal-black shadow-brutal-sm rounded-xl flex items-center justify-center text-xl font-extrabold">
            <i className="fa-solid fa-shield-halved text-brutal-black"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-brutal-black uppercase">
                VERIFY
                <span className="bg-brutal-yellow px-2 py-0.5 border-2 border-brutal-black rounded ml-1">
                  HUB
                </span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded bg-brutal-cyan border-2 border-brutal-black shadow-brutal-sm">
                Universal Platform
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Multi-Domain Document Verification System — Resumes, Bills, IDs, Credentials &amp; Legal
            </p>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="flex items-center bg-brutal-bg p-2 rounded-xl border-3 border-brutal-black shadow-brutal-sm gap-2">
          <span className="text-xs font-extrabold text-brutal-black px-2 hidden sm:inline flex items-center">
            <i className="fa-solid fa-sliders text-brutal-purple me-1.5"></i>
            ROLE:
          </span>

          <button
            type="button"
            onClick={() => onRoleChange("customer")}
            className={`neo-btn px-4 py-2 text-xs font-extrabold uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "customer"
                ? "bg-brutal-yellow text-brutal-black"
                : "bg-white text-brutal-black"
            }`}
          >
            <i className="fa-solid fa-user me-1"></i>
            Submitter View
          </button>

          <button
            type="button"
            onClick={() => onRoleChange("officer")}
            className={`neo-btn px-4 py-2 text-xs font-extrabold uppercase transition-all flex items-center gap-1.5 ${
              currentRole === "officer"
                ? "bg-brutal-yellow text-brutal-black"
                : "bg-white text-brutal-black"
            }`}
          >
            <i className="fa-solid fa-user-check me-1"></i>
            Verifier / Reviewer View
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-brutal-pink text-white text-[11px] border border-brutal-black shadow-brutal-sm font-black">
              {pendingCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
