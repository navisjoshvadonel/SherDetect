"use client";

import React, { useState } from "react";
import { ForensicReport } from "@/contracts/api-spec";

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
      <div className="neo-card p-6 text-center text-slate-600 bg-white font-bold">
        No forensic report data available for this document.
      </div>
    );
  }

  const isAuthentic = report.isAuthentic;
  const riskScore = report.fraudRiskScore;

  return (
    <div className="space-y-4">
      {/* Top Banner & Risk Score Gauge */}
      <div className="neo-card p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl border-2.5 border-brutal-black shadow-brutal-sm flex items-center justify-center font-mono font-black text-xl transition-transform hover:scale-105 ${
              riskScore > 50 ? "bg-brutal-pink text-white animate-pulse" : "bg-brutal-green text-brutal-black"
            }`}
          >
            {Math.round(riskScore)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-brutal-black uppercase">
                Forensic Risk Score
              </span>
              <span
                className={`neo-badge text-[10px] px-2 py-0.5 rounded ${
                  isAuthentic ? "badge-verified" : "badge-rejected animate-pulse"
                }`}
              >
                {report.verdict.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 font-mono">
              Audit ID: {report.documentId || docId} &bull; Processed in {report.processingTimeMs}ms
            </p>
          </div>
        </div>

        <div className="w-full md:w-56 space-y-1">
          <div className="flex justify-between text-[11px] font-black text-brutal-black uppercase">
            <span>Tamper Probability</span>
            <span className="font-mono">{riskScore}%</span>
          </div>
          <div className="h-2.5 w-full bg-brutal-bg rounded-full overflow-hidden border-2 border-brutal-black">
            <div
              style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
              className={`h-full transition-all duration-500 ${
                riskScore > 50 ? "bg-brutal-pink" : "bg-brutal-green"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Visual Document Canvas Box */}
      <div className="neo-card p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b-2 border-brutal-black pb-2">
          <h3 className="text-xs font-black text-brutal-black uppercase flex items-center gap-1.5">
            <i className="fa-solid fa-microscope text-brutal-purple me-1"></i>
            Document Forensic Canvas
          </h3>
          <span className="text-[10px] font-mono font-black bg-brutal-bg px-2 py-0.5 border border-brutal-black rounded">
            {fileName}
          </span>
        </div>

        {/* Bounding Box Visual Area with Scanner Line */}
        <div className="relative h-56 bg-brutal-bg rounded-xl border-2.5 border-brutal-black flex items-center justify-center overflow-hidden shadow-brutal-sm group">
          {/* Animated Radar Scanline */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brutal-cyan to-transparent opacity-80 z-20 animate-scanline pointer-events-none" />

          {showHeatmap && report.tamperHeatmapBase64 ? (
            <img
              src={report.tamperHeatmapBase64}
              alt="ELA Heatmap Analysis"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-4 space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center mx-auto text-brutal-black text-xl shadow-brutal-sm group-hover:rotate-6 transition-transform">
                <i className="fa-solid fa-file-contract"></i>
              </div>
              <p className="text-xs font-black text-brutal-black uppercase">
                Original Visual Layer Inspection
              </p>
              <p className="text-[10px] font-mono font-bold text-slate-600">{report.documentId}</p>
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
                className="absolute border-2.5 border-brutal-pink bg-brutal-pink/30 rounded pointer-events-none animate-pulse z-10"
              >
                <span className="absolute -top-5 left-0 bg-brutal-pink text-white text-[9px] px-1 py-0.2 rounded border border-brutal-black font-mono font-black uppercase whitespace-nowrap shadow-brutal-sm">
                  {box.label} ({Math.round(box.confidence * 100)}%)
                </span>
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full py-2.5 neo-btn bg-brutal-cyan text-brutal-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.01]"
        >
          <i className="fa-solid fa-layer-group me-1"></i>
          {showHeatmap ? "Switch to Bounding Box View" : "Toggle ELA Compression Heatmap"}
        </button>
      </div>

      {/* Multi-Layer Forensic Summary */}
      <div className="neo-card p-4 bg-white space-y-3">
        <h3 className="text-xs font-black text-brutal-black uppercase">
          Multi-Layer Forensic Summary
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-brutal-yellow/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[9px] uppercase font-black text-slate-700">Pixel ELA Score</p>
            <p className="text-sm font-black font-mono text-brutal-black mt-0.5">
              {report.forensicBreakdown.elaScore}
            </p>
          </div>
          <div className="p-2 bg-brutal-cyan/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[9px] uppercase font-black text-slate-700">Metadata Tamper</p>
            <p
              className={`text-sm font-black mt-0.5 ${
                report.forensicBreakdown.metadataTampered ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {report.forensicBreakdown.metadataTampered ? "DETECTED" : "CLEAR"}
            </p>
          </div>
          <div className="p-2 bg-brutal-purple/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[9px] uppercase font-black text-slate-700">AI Semantic Check</p>
            <p
              className={`text-sm font-black mt-0.5 ${
                report.forensicBreakdown.semanticDiscrepancy ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {report.forensicBreakdown.semanticDiscrepancy ? "MISMATCH" : "PASSED"}
            </p>
          </div>
        </div>

        {report.forensicBreakdown.softwareFingerprintDetected && (
          <div className="p-2 bg-brutal-orange/20 border border-brutal-black rounded-lg flex items-center justify-between text-[11px] shadow-brutal-sm">
            <span className="text-brutal-black font-black uppercase text-[9px]">
              EXIF Software Signature
            </span>
            <span className="font-mono text-brutal-black font-extrabold">
              {report.forensicBreakdown.softwareFingerprintDetected}
            </span>
          </div>
        )}

        <div className="p-3 bg-brutal-yellow/30 border-2 border-brutal-black rounded-lg text-xs text-brutal-black font-bold leading-relaxed space-y-0.5 shadow-brutal-sm">
          <p className="font-black uppercase text-[10px] tracking-wider text-brutal-black">
            Forensic Investigator Narrative:
          </p>
          <p className="text-[11px]">{report.forensicSummary}</p>
        </div>
      </div>
    </div>
  );
};
