"use client";

import React from "react";
import { AuditLogItem } from "../types";

interface AuditTrailProps {
  logs: AuditLogItem[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  return (
    <div className="neo-card overflow-hidden">
      <div className="p-4 border-b-3 border-brutal-black flex items-center justify-between bg-brutal-purple text-white">
        <span className="font-black text-sm uppercase flex items-center">
          <i className="fa-solid fa-clock-rotate-left me-2"></i>
          Audit Log History
        </span>
        <span className="text-xs font-black bg-white text-brutal-black px-3 py-1 border-2 border-brutal-black rounded shadow-brutal-sm">
          Audit Enforced
        </span>
      </div>

      <div className="p-4 bg-white">
        {logs.length === 0 ? (
          <p className="text-xs font-bold text-slate-500 text-center py-4">
            No audit log records found.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const badgeClass =
                log.action === "verified"
                  ? "badge-verified"
                  : log.action === "rejected"
                  ? "badge-rejected"
                  : log.action === "resubmit"
                  ? "badge-resubmit"
                  : "badge-under_review";

              return (
                <div
                  key={log.id}
                  className="p-3 bg-brutal-bg border-2 border-brutal-black rounded-xl shadow-brutal-sm space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-brutal-black font-extrabold">{log.user}</span>
                      <span className={`neo-badge ${badgeClass} text-[10px] px-2 py-0.5 rounded`}>
                        {log.action}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 font-bold">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{log.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
