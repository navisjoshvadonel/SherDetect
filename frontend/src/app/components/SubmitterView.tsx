"use client";

import React, { useState } from "react";
import {
  DomainKey,
  DocumentItem,
  DOMAIN_CATEGORIES,
  DOMAIN_LABELS,
} from "../types";

interface SubmitterViewProps {
  documents: DocumentItem[];
  onSubmitDocument: (domain: DomainKey, docType: string, file: File) => void;
  onInspectDocument: (docId: string) => void;
}

export const SubmitterView: React.FC<SubmitterViewProps> = ({
  documents,
  onSubmitDocument,
  onInspectDocument,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>("hr_employment");
  const [selectedDocType, setSelectedDocType] = useState<string>(
    DOMAIN_CATEGORIES["hr_employment"][0].val
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDomainChange = (domain: DomainKey) => {
    setSelectedDomain(domain);
    const opts = DOMAIN_CATEGORIES[domain];
    if (opts && opts.length > 0) {
      setSelectedDocType(opts[0].val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSubmitDocument(selectedDomain, selectedDocType, selectedFile);
    setSelectedFile(null);
  };

  const getFormatIcon = (ext: string) => {
    const cleanExt = ext.toLowerCase();
    if (["pdf"].includes(cleanExt)) return "text-rose-400";
    if (["doc", "docx"].includes(cleanExt)) return "text-blue-400";
    if (["xls", "xlsx", "csv"].includes(cleanExt)) return "text-emerald-400";
    if (["png", "jpg", "jpeg", "webp"].includes(cleanExt)) return "text-purple-400";
    return "text-slate-400";
  };

  // Stats calculation
  const totalCount = documents.length;
  const pendingCount = documents.filter(
    (d) => d.status === "pending" || d.status === "under_review"
  ).length;
  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const actionNeededCount = documents.filter(
    (d) => d.status === "rejected" || d.status === "resubmit"
  ).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Universal Upload Form Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 uppercase tracking-wide">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </h3>
              <span className="text-[10px] font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                MAX 50MB
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Domain Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  1. Select Target Domain *
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => handleDomainChange(e.target.value as DomainKey)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {(Object.keys(DOMAIN_LABELS) as DomainKey[]).map((key) => (
                    <option key={key} value={key}>
                      {DOMAIN_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doc Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  2. Document Category *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {DOMAIN_CATEGORIES[selectedDomain].map((opt) => (
                    <option key={opt.val} value={opt.val}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  3. Select / Drop File *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all bg-slate-950/60 ${
                    dragActive
                      ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept="image/*,.pdf,.docx,.xlsx,.csv,.zip,.txt"
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-200 uppercase">
                    Drag & Drop file here, or <span className="text-cyan-400 underline">Browse</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PDF, DOCX, XLSX, PNG, JPG, CSV, ZIP, TXT up to 50MB
                  </p>

                  {selectedFile && (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  selectedFile
                    ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit For AI Forensic Audit
              </button>
            </form>
          </div>
        </div>

        {/* Right Section: Stats & Document List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Submissions</span>
              <span className="text-3xl font-black text-slate-100 font-mono mt-1 block">{totalCount}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-amber-400 block">Pending Review</span>
              <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">{pendingCount}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-emerald-400 block">Verified Docs</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">{verifiedCount}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-rose-400 block">Action Needed</span>
              <span className="text-3xl font-black text-rose-400 font-mono mt-1 block">{actionNeededCount}</span>
            </div>
          </div>

          {/* Submitted Documents Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 uppercase tracking-wide">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Submitted Documents & Audit Tracking
              </h3>
              <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 border border-slate-800 rounded-lg">
                User #USR-88219
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Domain</th>
                    <th className="p-3.5">Document Type</th>
                    <th className="p-3.5">File Name</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {documents.map((doc) => {
                    const badgeStyles: Record<string, string> = {
                      pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                      under_review: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
                      verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                      rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
                      resubmit: "bg-orange-500/10 text-orange-400 border-orange-500/30",
                    };

                    return (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold uppercase text-[10px] text-slate-400">
                          {doc.domainDisplay}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-200">{doc.docTypeDisplay}</td>
                        <td className="p-3.5 font-mono text-slate-300 flex items-center gap-2">
                          <span className={`font-bold ${getFormatIcon(doc.fileExt)}`}>
                            .{doc.fileExt}
                          </span>
                          <span className="truncate max-w-[160px]">{doc.fileName}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              badgeStyles[doc.status] || badgeStyles.pending
                            }`}
                          >
                            {doc.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onInspectDocument(doc.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-[11px] font-bold transition"
                          >
                            Inspect Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
