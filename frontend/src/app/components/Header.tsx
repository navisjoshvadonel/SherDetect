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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 text-xl font-black shadow-lg shadow-cyan-500/10">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white uppercase">
                SHER<span className="text-cyan-400">DETECT</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Multi-Domain AI Suite
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous Document Forensic & Verification Engine — Resumes, Bills, IDs, Credentials & Legal
            </p>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1.5">
          <span className="text-xs font-semibold text-slate-400 px-2 hidden sm:inline flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            ROLE:
          </span>
          <button
            onClick={() => onRoleChange("customer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-1.5 ${
              currentRole === "customer"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Submitter View
          </button>

          <button
            onClick={() => onRoleChange("officer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-1.5 ${
              currentRole === "officer"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Reviewer Worklist
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
