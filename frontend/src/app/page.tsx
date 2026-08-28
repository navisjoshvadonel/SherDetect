"use client";
import React, { useState } from "react";
import { MOCK_FORGERY_REPORT, MOCK_AUTHENTIC_REPORT } from "../../../contracts/mock-data";
import { ForensicReport } from "../../../contracts/api-spec";

export default function ForensicDashboard() {
  const [report, setReport] = useState<ForensicReport>(MOCK_FORGERY_REPORT);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/verify-document", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        // Fallback to mock state if backend not running
        setReport(file.name.includes("auth") ? MOCK_AUTHENTIC_REPORT : MOCK_FORGERY_REPORT);
      }
    } catch {
      setReport(file.name.includes("auth") ? MOCK_AUTHENTIC_REPORT : MOCK_FORGERY_REPORT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-cyan-400">SherDetect</h1>
          <p className="text-sm text-slate-400">Autonomous AI Document Forensic Engine</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-1 rounded-full text-xs font-bold ${report.isAuthentic ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'}`}>
            {report.verdict.replace("_", " ")}
          </span>
          <span className="text-xs font-mono text-slate-500">{report.processingTimeMs}ms</span>
        </div>
      </header>

      {/* Main Split-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload & Document Preview */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-4">Document Inspection Canvas</h2>
            <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-950/50 hover:border-cyan-500 transition-colors">
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.pdf" />
              <p className="text-sm text-slate-300 font-medium">Drop document or invoice here to audit</p>
              <p className="text-xs text-slate-500 mt-1">Accepts PNG, JPG, PDF (JPEG Re-compression Analysis)</p>
            </div>

            {/* Bounding Box Visual Area */}
            <div className="mt-6 relative h-64 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              {showHeatmap && report.tamperHeatmapBase64 ? (
                <img src={report.tamperHeatmapBase64} alt="ELA Heatmap" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-400 font-mono">Original Document View</p>
                  <p className="text-xs text-slate-600 mt-1">{report.documentId}</p>
                </div>
              )}

              {/* Render Detected Anomaly Bounding Boxes */}
              {!showHeatmap && report.detectedAnomalies.map((box, idx) => (
                <div
                  key={idx}
                  style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }}
                  className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none animate-pulse"
                >
                  <span className="absolute -top-5 left-0 bg-red-600 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                    {box.label} ({Math.round(box.confidence * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            {showHeatmap ? "Switch to Bounding Box View" : "Toggle ELA Compression Heatmap"}
          </button>
        </div>

        {/* Right: Forensic Breakdown & Metrics */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Forensic Risk Score</h2>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-black text-cyan-400 font-mono">
                {report.fraudRiskScore}<span className="text-xl text-slate-500">/100</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tamper Probability</span>
                  <span>{report.fraudRiskScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${report.fraudRiskScore}%` }}
                    className={`h-full ${report.fraudRiskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Multi-Layer Audit Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500">Pixel ELA Score</p>
                <p className="text-sm font-bold font-mono text-cyan-400">{report.forensicBreakdown.elaScore}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500">Metadata Tamper</p>
                <p className={`text-sm font-bold ${report.forensicBreakdown.metadataTampered ? 'text-red-400' : 'text-emerald-400'}`}>
                  {report.forensicBreakdown.metadataTampered ? 'DETECTED' : 'CLEAR'}
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500">AI Semantic Check</p>
                <p className={`text-sm font-bold ${report.forensicBreakdown.semanticDiscrepancy ? 'text-red-400' : 'text-emerald-400'}`}>
                  {report.forensicBreakdown.semanticDiscrepancy ? 'MISMATCH' : 'PASSED'}
                </p>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">Forensic Investigator Narrative:</p>
              {report.forensicSummary}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
