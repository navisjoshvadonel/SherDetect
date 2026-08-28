"use client";

import React, { useState } from "react";
import { ForensicReport } from "../../../contracts/api-spec";

interface ForensicCanvasProps {
  report?: ForensicReport;
  fileName?: string;
  docId?: string;
}

export const ForensicCanvas: React.FC<ForensicCanvasProps> = ({
  report,
  fileName = "Document_Scan.pdf",
  docId = "DOC-UNKNOWN",
}) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (!report) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        No forensic report available for this document.
      </div>
    );
  }

  const isAuthentic = report.isAuthentic;
  const riskScore = report.fraudRiskScore;

  return (
    <div className="space-y-6">
      {/* Top Banner & Risk Score */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-2xl border ${
              riskScore > 50
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {Math.round(riskScore)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100">Forensic Risk Score</span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  isAuthentic
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                }`}
              >
                {report.verdict.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Audit ID: {report.documentId || docId} &bull; Processed in {report.processingTimeMs}ms
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-semibold">
            <span>Tamper Probability</span>
            <span className="font-mono">{riskScore}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
              className={`h-full transition-all duration-500 ${
                riskScore > 50 ? "bg-rose-500 shadow-lg shadow-rose-500/50" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas Box */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Document Inspection Canvas
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {fileName}
          </span>
        </div>

        {/* Bounding Box Visual Area */}
        <div className="relative h-72 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
          {showHeatmap && report.tamperHeatmapBase64 ? (
            <img
              src={report.tamperHeatmapBase64}
              alt="ELA Heatmap Analysis"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs font-mono text-slate-400">Standard Document Layer View</p>
              <p className="text-[11px] text-slate-600 font-mono">{report.documentId}</p>
            </div>
          )}

          {/* Render Anomaly Bounding Boxes */}
          {!showHeatmap &&
            report.detectedAnomalies.map((box, idx) => (
              <div
                key={idx}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
                className="absolute border-2 border-rose-500 bg-rose-500/20 rounded pointer-events-none animate-pulse"
              >
                <span className="absolute -top-6 left-0 bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold whitespace-nowrap shadow-md">
                  {box.label} ({Math.round(box.confidence * 100)}%)
                </span>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-bold transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {showHeatmap ? "Switch to Bounding Box View" : "Toggle ELA Compression Heatmap"}
        </button>
      </div>

      {/* Forensic Breakdown Grid */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
          Multi-Layer Forensic Summary
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <p className="text-[10px] uppercase font-bold text-slate-500">Pixel ELA Score</p>
            <p className="text-sm font-bold font-mono text-cyan-400 mt-1">
              {report.forensicBreakdown.elaScore}
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <p className="text-[10px] uppercase font-bold text-slate-500">Metadata Tamper</p>
            <p
              className={`text-sm font-bold mt-1 ${
                report.forensicBreakdown.metadataTampered ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {report.forensicBreakdown.metadataTampered ? "DETECTED" : "CLEAR"}
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <p className="text-[10px] uppercase font-bold text-slate-500">AI Semantic Check</p>
            <p
              className={`text-sm font-bold mt-1 ${
                report.forensicBreakdown.semanticDiscrepancy ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {report.forensicBreakdown.semanticDiscrepancy ? "MISMATCH" : "PASSED"}
            </p>
          </div>
        </div>

        {report.forensicBreakdown.softwareFingerprintDetected && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">EXIF Software Signature</span>
            <span className="font-mono text-amber-400 font-semibold">
              {report.forensicBreakdown.softwareFingerprintDetected}
            </span>
          </div>
        )}

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
          <p className="font-bold text-slate-200 uppercase text-[10px] tracking-wider text-cyan-400">
            Forensic Investigator Narrative
          </p>
          <p>{report.forensicSummary}</p>
        </div>
      </div>
    </div>
  );
};
