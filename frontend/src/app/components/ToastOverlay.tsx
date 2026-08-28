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
        const typeBg = {
          success: "bg-brutal-green text-brutal-black",
          danger: "bg-brutal-pink text-white",
          warning: "bg-brutal-yellow text-brutal-black",
          info: "bg-brutal-cyan text-brutal-black",
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 border-3 border-brutal-black shadow-brutal-lg rounded-xl flex items-center justify-between gap-3 text-xs font-black uppercase transition-all duration-200 animate-toast ${typeBg}`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-base font-black hover:scale-125 transition cursor-pointer px-1"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
