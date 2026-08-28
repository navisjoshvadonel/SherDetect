"use client";

import React from "react";
import { AuditLogItem } from "../types";

interface AuditTrailProps {
  logs: AuditLogItem[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  const getActionBadge = (action: AuditLogItem["action"]) => {
    switch (action) {
      case "submitted":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "verified":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "resubmit":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <span className="font-bold text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Audit Log History Timeline
        </span>
        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded">
          AUDIT ENFORCED
        </span>
      </div>

      <div className="p-5 bg-slate-950/50">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No audit logs recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.user}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{log.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
