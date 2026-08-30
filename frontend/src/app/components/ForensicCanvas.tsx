"use client";

import React, { useState } from "react";
import { ForensicReport } from "@/contracts/api-spec";
import { ExportAffidavitButton } from "./ExportAffidavitButton";

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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  if (!report) {
    return (
      <div className="neo-card p-4 text-center text-slate-600 bg-white font-bold text-xs">
        No forensic report data available for this document.
      </div>
    );
  }

  const isAuthentic = report.isAuthentic;
  const riskScore = report.fraudRiskScore;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.75, prev - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  const handleRunReScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1800);
  };

  return (
    <div className="space-y-3">
      {/* Top Risk Score & Metric Gauge */}
      <div className="neo-card p-3 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border-2.5 border-brutal-black shadow-brutal-sm flex items-center justify-center font-mono font-black text-lg transition-transform hover:scale-110 ${
              riskScore > 50 ? "bg-brutal-pink text-white animate-badge-pulse" : "bg-brutal-green text-brutal-black"
            }`}
          >
            {Math.round(riskScore)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-brutal-black uppercase">
                Forensic Risk Score
              </span>
              <span
                className={`neo-badge text-[9.5px] px-2 py-0.5 rounded ${
                  isAuthentic ? "badge-verified" : "badge-rejected animate-badge-pulse"
                }`}
              >
                {report.verdict.replace("_", " ")}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 font-mono">
              Audit ID: {report.documentId || docId} &bull; Processed in {report.processingTimeMs}ms
            </p>
          </div>
        </div>

        <div className="w-full md:w-56 space-y-1">
          <div className="flex justify-between text-[10px] font-black text-brutal-black uppercase">
            <span>Tamper Risk Level</span>
            <span className="font-mono">{riskScore}%</span>
          </div>
          <div className="h-2.5 w-full bg-brutal-bg rounded-full overflow-hidden border-2 border-brutal-black relative">
            <div
              style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
              className={`h-full transition-all duration-700 ${
                riskScore > 50 ? "bg-brutal-pink" : "bg-brutal-green"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Visual Canvas Header & Zoom Toolbar */}
      <div className="neo-card p-3 bg-white space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-brutal-black pb-1.5">
          <h3 className="text-xs font-black text-brutal-black uppercase flex items-center gap-1.5">
            <i className="fa-solid fa-microscope text-brutal-purple me-1 animate-icon-pop"></i>
            Document Forensic Inspector Canvas
          </h3>

          {/* Canvas Zoom & Re-Scan Controls */}
          <div className="flex items-center gap-1 bg-brutal-bg p-1 border border-brutal-black rounded-lg">
            <button
              type="button"
              onClick={handleZoomOut}
              className="px-1.5 py-0.5 bg-white text-brutal-black font-black text-[10px] border border-brutal-black rounded hover:bg-brutal-yellow"
              title="Zoom Out"
            >
              <i className="fa-solid fa-magnifying-glass-minus"></i>
            </button>
            <span className="text-[9.5px] font-mono font-black px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="px-1.5 py-0.5 bg-white text-brutal-black font-black text-[10px] border border-brutal-black rounded hover:bg-brutal-yellow"
              title="Zoom In"
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i>
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 bg-white text-brutal-black font-black text-[9px] uppercase border border-brutal-black rounded hover:bg-brutal-cyan ml-1"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRunReScan}
              disabled={isScanning}
              className="px-2 py-0.5 bg-brutal-yellow text-brutal-black font-black text-[9px] uppercase border border-brutal-black rounded hover:scale-105 active:scale-95 ml-1 flex items-center gap-1"
            >
              <i className={`fa-solid fa-rotate-right ${isScanning ? "animate-spin" : ""}`}></i>
              Re-Scan
            </button>
          </div>
        </div>

        {/* Visual Inspection Area with Scanner Line & Zoom Transformation */}
        <div className="relative h-48 bg-brutal-bg rounded-xl border-2.5 border-brutal-black flex items-center justify-center overflow-hidden shadow-brutal-sm group">
          {/* Animated Radar Scanline */}
          <div
            className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brutal-cyan to-transparent opacity-90 z-20 pointer-events-none ${
              isScanning ? "animate-spin" : "animate-scanline"
            }`}
          />

          {isScanning && (
            <div className="absolute inset-0 bg-brutal-black/40 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-white animate-toast">
              <i className="fa-solid fa-atom text-2xl animate-spin mb-1 text-brutal-yellow"></i>
              <span className="text-xs font-black uppercase tracking-wider">
                Re-Running 6-Layer Forensic Scan...
              </span>
            </div>
          )}

          <div
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full h-full flex items-center justify-center transition-transform duration-200 relative"
          >
            {showHeatmap && report.tamperHeatmapBase64 ? (
              <img
                src={report.tamperHeatmapBase64}
                alt="ELA Heatmap Analysis"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-3 space-y-1">
                <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center mx-auto text-brutal-black text-lg shadow-brutal-sm group-hover:rotate-12 transition-transform duration-300">
                  <i className="fa-solid fa-file-contract text-brutal-black"></i>
                </div>
                <p className="text-xs font-black text-brutal-black uppercase">
                  Original Visual Layer Inspection
                </p>
                <p className="text-[9.5px] font-mono font-bold text-slate-600">{report.documentId}</p>
              </div>
            )}

            {/* Anomaly Bounding Boxes */}
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
                  <span className="absolute -top-5 left-0 bg-brutal-pink text-white text-[8.5px] px-1 py-0.2 rounded border border-brutal-black font-mono font-black uppercase whitespace-nowrap shadow-brutal-sm flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation text-white"></i>
                    {box.label} ({Math.round(box.confidence * 100)}%)
                  </span>
                </div>
              ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full py-2 neo-btn bg-brutal-cyan text-brutal-black text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.01]"
        >
          <i className="fa-solid fa-layer-group me-1 text-brutal-black"></i>
          {showHeatmap ? "Switch to Bounding Box View" : "Toggle ELA Compression Heatmap"}
        </button>
      </div>

      {/* Multi-Layer Forensic Summary */}
      <div className="neo-card p-3 bg-white space-y-2">
        <h3 className="text-[11px] font-black text-brutal-black uppercase">
          Multi-Layer Forensic Summary
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-1.5 bg-brutal-yellow/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[8.5px] uppercase font-black text-slate-700">Pixel ELA Score</p>
            <p className="text-xs font-black font-mono text-brutal-black mt-0.5">
              {report.forensicBreakdown.elaScore}
            </p>
          </div>
          <div className="p-1.5 bg-brutal-cyan/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[8.5px] uppercase font-black text-slate-700">Metadata Tamper</p>
            <p
              className={`text-xs font-black mt-0.5 ${
                report.forensicBreakdown.metadataTampered ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {report.forensicBreakdown.metadataTampered ? "DETECTED" : "CLEAR"}
            </p>
          </div>
          <div className="p-1.5 bg-brutal-purple/20 border border-brutal-black rounded-lg shadow-brutal-sm">
            <p className="text-[8.5px] uppercase font-black text-slate-700">AI Semantic Check</p>
            <p
              className={`text-xs font-black mt-0.5 ${
                report.forensicBreakdown.semanticDiscrepancy ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {report.forensicBreakdown.semanticDiscrepancy ? "MISMATCH" : "PASSED"}
            </p>
          </div>
        </div>

        {report.forensicBreakdown.softwareFingerprintDetected && (
          <div className="p-1.5 bg-brutal-orange/20 border border-brutal-black rounded-lg flex items-center justify-between text-[10px] shadow-brutal-sm">
            <span className="text-brutal-black font-black uppercase text-[8.5px]">
              EXIF Software Signature
            </span>
            <span className="font-mono text-brutal-black font-extrabold text-[10px]">
              {report.forensicBreakdown.softwareFingerprintDetected}
            </span>
          </div>
        )}

        {report.fileHash && (
          <div className="p-1.5 bg-brutal-bg border border-brutal-black rounded-lg flex flex-col justify-center text-[10px] shadow-brutal-sm gap-0.5">
            <span className="text-brutal-black font-black uppercase text-[8.5px] flex items-center gap-1">
              <i className="fa-solid fa-fingerprint text-brutal-purple"></i>
              Immutable File Hash (SHA-256)
            </span>
            <span className="font-mono text-brutal-black font-extrabold text-[9px] break-all">
              {report.fileHash}
            </span>
          </div>
        )}

        <div className="p-2 bg-brutal-yellow/30 border-2 border-brutal-black rounded-lg text-[11px] text-brutal-black font-bold leading-relaxed space-y-0.5 shadow-brutal-sm">
          <p className="font-black uppercase text-[9.5px] tracking-wider text-brutal-black">
            Forensic Investigator Narrative:
          </p>
          <p className="text-[10.5px]">{report.forensicSummary}</p>
        </div>
        
        {/* Generate PDF Affidavit Button */}
        <div className="pt-2 border-t-2 border-brutal-black mt-3">
          <ExportAffidavitButton report={report} />
        </div>
      </div>
    </div>
  );
};
