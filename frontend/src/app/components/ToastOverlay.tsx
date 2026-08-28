"use client";

import React from "react";
import { ToastMessage } from "../types";

interface ToastOverlayProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastOverlay: React.FC<ToastOverlayProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const typeStyles = {
          success: "bg-emerald-950 border-emerald-500/50 text-emerald-300",
          danger: "bg-rose-950 border-rose-500/50 text-rose-300",
          warning: "bg-amber-950 border-amber-500/50 text-amber-300",
          info: "bg-cyan-950 border-cyan-500/50 text-cyan-300",
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md transition-all ${typeStyles}`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
