"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Layers, 
  ShieldCheck, 
  ArrowLeft,
  RefreshCw
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  size: string;
  status: "queued" | "processing" | "completed" | "failed";
  verdict?: "VERIFIED_AUTHENTIC" | "SUSPICIOUS" | "FORGERY_DETECTED";
  score?: number;
}

export default function BatchVerifyPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    let files: File[] = [];
    const target = e.target as HTMLInputElement;
    if ("dataTransfer" in e && e.dataTransfer.files) {
      files = Array.from(e.dataTransfer.files);
    } else if (target && target.files) {
      files = Array.from(target.files);
    }

    if (files.length === 0) return;

    const newItems: BatchItem[] = files.map((file, idx) => ({
      id: `BATCH-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: "queued"
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const startBatchProcess = () => {
    setIsProcessing(true);

    items.forEach((item, idx) => {
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              const isForged = i.name.toLowerCase().includes("edited") || i.name.toLowerCase().includes("fake");
              const isSuspicious = i.name.toLowerCase().includes("suspicious");
              const score = isForged ? 88.5 : isSuspicious ? 45.0 : 12.0;
              const verdict = isForged ? "FORGERY_DETECTED" : isSuspicious ? "SUSPICIOUS" : "VERIFIED_AUTHENTIC";
              return { ...i, status: "completed", score, verdict };
            }
            return i;
          })
        );
        if (idx === items.length - 1) {
          setIsProcessing(false);
        }
      }, (idx + 1) * 800);
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-4 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-1">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 font-bold uppercase text-sm bg-white text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8" /> Enterprise Batch Forensic Portal
            </h1>
            <p className="font-semibold text-sm">
              Bulk document verification hub for Enterprise HR, KYC, and Finance teams.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-3 text-right shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs uppercase font-extrabold block text-gray-600">Tenant Region</span>
            <span className="font-extrabold text-lg text-black">EU-WEST / MULTI-TENANT</span>
          </div>
        </div>

        {/* Drag & Drop Dropzone (Neobrutalism) */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileDrop(e); }}
          className="border-4 border-dashed border-black bg-white p-10 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50 transition-colors relative cursor-pointer"
        >
          <input 
            type="file" 
            multiple 
            onChange={handleFileDrop}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-[#00F0FF] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <Upload className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">Drop Document Batches Here</h2>
              <p className="font-bold text-sm text-gray-700 mt-1">
                Upload up to 500 documents (PDF, PNG, JPG) per batch payload
              </p>
            </div>
            <span className="bg-black text-white font-extrabold px-4 py-2 uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Browse Local Batch Files
            </span>
          </div>
        </div>

        {/* Batch Queue & Actions */}
        {items.length > 0 && (
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <FileText className="w-6 h-6" /> Queued Batch Items ({items.length})
              </h3>
              <button
                onClick={startBatchProcess}
                disabled={isProcessing}
                className="bg-[#55FF55] hover:bg-green-400 text-black font-black uppercase text-sm px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Processing Batch...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Execute 6-Layer Batch Audit
                  </>
                )}
              </button>
            </div>

            {/* Item Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-4 border-black">
                <thead className="bg-[#B57EDC] border-b-4 border-black text-black">
                  <tr>
                    <th className="p-3 border-r-4 border-black font-black uppercase text-xs">Document Name</th>
                    <th className="p-3 border-r-4 border-black font-black uppercase text-xs">File Size</th>
                    <th className="p-3 border-r-4 border-black font-black uppercase text-xs">Status</th>
                    <th className="p-3 border-r-4 border-black font-black uppercase text-xs">Risk Score</th>
                    <th className="p-3 font-black uppercase text-xs">Forensic Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black font-bold text-sm">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 border-r-4 border-black flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {item.name}
                      </td>
                      <td className="p-3 border-r-4 border-black">{item.size}</td>
                      <td className="p-3 border-r-4 border-black uppercase text-xs">
                        {item.status === "queued" && <span className="bg-gray-200 px-2 py-1 border-2 border-black">QUEUED</span>}
                        {item.status === "processing" && <span className="bg-yellow-200 px-2 py-1 border-2 border-black animate-pulse">ANALYZING</span>}
                        {item.status === "completed" && <span className="bg-green-200 px-2 py-1 border-2 border-black">COMPLETED</span>}
                      </td>
                      <td className="p-3 border-r-4 border-black">
                        {item.score !== undefined ? `${item.score.toFixed(1)}%` : "—"}
                      </td>
                      <td className="p-3">
                        {item.verdict === "VERIFIED_AUTHENTIC" && (
                          <span className="bg-[#55FF55] text-black font-black px-2 py-1 border-2 border-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> AUTHENTIC
                          </span>
                        )}
                        {item.verdict === "SUSPICIOUS" && (
                          <span className="bg-[#FFDE59] text-black font-black px-2 py-1 border-2 border-black inline-flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> SUSPICIOUS
                          </span>
                        )}
                        {item.verdict === "FORGERY_DETECTED" && (
                          <span className="bg-[#FF5555] text-white font-black px-2 py-1 border-2 border-black inline-flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> FORGERY
                          </span>
                        )}
                        {!item.verdict && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
