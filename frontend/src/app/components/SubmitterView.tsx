"use client";

import React, { useState, useEffect } from "react";
import {
  DomainKey,
  DocumentItem,
  DOMAIN_CATEGORIES,
  DOMAIN_LABELS,
} from "../types";

interface SubmitterViewProps {
  documents: DocumentItem[];
  activeDomainFilter: string;
  onSubmitDocument: (domain: DomainKey, docType: string, file: File) => void;
  onInspectDocument: (docId: string) => void;
}

export const SubmitterView: React.FC<SubmitterViewProps> = ({
  documents,
  activeDomainFilter,
  onSubmitDocument,
  onInspectDocument,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>("hr_employment");
  const [selectedDocType, setSelectedDocType] = useState<string>(
    DOMAIN_CATEGORIES["hr_employment"][0].val
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Sync selected domain if activeDomainFilter changes from banner
  useEffect(() => {
    if (activeDomainFilter !== "all" && DOMAIN_CATEGORIES[activeDomainFilter as DomainKey]) {
      const dom = activeDomainFilter as DomainKey;
      setSelectedDomain(dom);
      const opts = DOMAIN_CATEGORIES[dom];
      if (opts && opts.length > 0) {
        setSelectedDocType(opts[0].val);
      }
    }
  }, [activeDomainFilter]);

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

  const getFormatIconClass = (ext: string) => {
    const cleanExt = ext.toLowerCase();
    if (["pdf"].includes(cleanExt)) return "fa-solid fa-file-pdf text-rose-600";
    if (["doc", "docx"].includes(cleanExt)) return "fa-solid fa-file-word text-blue-600";
    if (["xls", "xlsx", "csv"].includes(cleanExt)) return "fa-solid fa-file-excel text-emerald-600";
    if (["png", "jpg", "jpeg", "webp", "svg"].includes(cleanExt)) return "fa-solid fa-file-image text-purple-600";
    if (["zip", "rar", "7z"].includes(cleanExt)) return "fa-solid fa-file-zipper text-amber-600";
    return "fa-solid fa-file text-slate-600";
  };

  // Filter documents by active domain filter
  const filteredDocs = documents.filter((d) =>
    activeDomainFilter === "all" ? true : d.domain === activeDomainFilter
  );

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Upload Card */}
        <div className="lg:col-span-1 neo-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2.5 border-brutal-black pb-2.5">
              <h3 className="font-black text-brutal-black text-sm flex items-center gap-2 uppercase">
                <i className="fa-solid fa-cloud-arrow-up text-brutal-pink"></i>
                Upload Any Document
              </h3>
              <span className="text-[10px] font-black bg-brutal-cyan text-brutal-black px-2 py-0.5 rounded border-2 border-brutal-black shadow-brutal-sm">
                MAX 50MB
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Domain Select */}
              <div>
                <label className="block text-[11px] font-black text-brutal-black mb-1 uppercase">
                  1. Select Target Domain *
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => handleDomainChange(e.target.value as DomainKey)}
                  required
                  className="w-full neo-input px-3 py-2 text-xs font-bold text-brutal-black"
                >
                  {(Object.keys(DOMAIN_LABELS) as DomainKey[]).map((key) => (
                    <option key={key} value={key}>
                      {DOMAIN_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doc Type Select */}
              <div>
                <label className="block text-[11px] font-black text-brutal-black mb-1 uppercase">
                  2. Document Type *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  required
                  className="w-full neo-input px-3 py-2 text-xs font-bold text-brutal-black"
                >
                  {DOMAIN_CATEGORIES[selectedDomain].map((opt) => (
                    <option key={opt.val} value={opt.val}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Zone */}
              <div>
                <label className="block text-[11px] font-black text-brutal-black mb-1 uppercase">
                  3. Drag &amp; Drop File (Any Format) *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2.5 border-dashed border-brutal-black rounded-xl p-4 text-center cursor-pointer transition-all duration-200 bg-brutal-bg flex flex-col items-center justify-center relative ${
                    dragActive ? "drag-active" : "hover:bg-brutal-yellow/10"
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept="image/*,.pdf,.docx,.xlsx,.csv,.zip,.txt"
                  />

                  <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-brutal-black text-brutal-black flex items-center justify-center text-lg mb-1.5 shadow-brutal-sm group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-file-arrow-up animate-bounce"></i>
                  </div>

                  <p className="text-[11px] font-black text-brutal-black mb-0.5 uppercase">
                    DRAG &amp; DROP FILE HERE, OR{" "}
                    <span className="bg-brutal-cyan px-1 border border-brutal-black rounded">
                      BROWSE
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-600">
                    Supports PDF, DOCX, XLSX, PNG, JPG, CSV, ZIP, TXT up to 50MB
                  </p>

                  {selectedFile && (
                    <div className="mt-2 p-1.5 rounded-lg bg-brutal-green border-2 border-brutal-black text-xs font-black text-brutal-black w-full flex items-center justify-center gap-2 shadow-brutal-sm animate-toast">
                      <i className={getFormatIconClass(selectedFile.name.split(".").pop() || "")}></i>
                      <span className="truncate max-w-[140px]">{selectedFile.name}</span>
                      <span className="text-[10px] bg-white px-1 border border-brutal-black rounded">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFile}
                className={`w-full py-2.5 neo-btn text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  selectedFile
                    ? "bg-brutal-yellow text-brutal-black cursor-pointer shadow-brutal"
                    : "bg-slate-200 text-slate-400 border-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                <i className="fa-solid fa-paper-plane me-1"></i>
                Submit Document For Verification Review
              </button>
            </form>
          </div>
        </div>

        {/* Submitter Documents List & Status Tracker */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="neo-card p-3 bg-white transition-transform hover:-translate-y-1">
              <span className="text-[11px] font-black uppercase text-slate-600 block">
                Total Submissions
              </span>
              <span className="text-2xl font-black text-brutal-black mt-0.5 block font-mono">
                {totalCount}
              </span>
            </div>
            <div className="neo-card p-3 bg-brutal-yellow transition-transform hover:-translate-y-1">
              <span className="text-[11px] font-black uppercase text-brutal-black block">
                Pending Review
              </span>
              <span className="text-2xl font-black text-brutal-black mt-0.5 block font-mono">
                {pendingCount}
              </span>
            </div>
            <div className="neo-card p-3 bg-brutal-green transition-transform hover:-translate-y-1">
              <span className="text-[11px] font-black uppercase text-brutal-black block">
                Verified Docs
              </span>
              <span className="text-2xl font-black text-brutal-black mt-0.5 block font-mono">
                {verifiedCount}
              </span>
            </div>
            <div className="neo-card p-3 bg-brutal-pink transition-transform hover:-translate-y-1">
              <span className="text-[11px] font-black uppercase text-brutal-black block">
                Action Needed
              </span>
              <span className="text-2xl font-black text-brutal-black mt-0.5 block font-mono">
                {actionNeededCount}
              </span>
            </div>
          </div>

          {/* Documents Table */}
          <div className="neo-card overflow-hidden">
            <div className="p-3 border-b-2.5 border-brutal-black flex items-center justify-between bg-white">
              <h3 className="font-black text-brutal-black text-xs flex items-center gap-2 uppercase">
                <i className="fa-solid fa-folder-tree text-brutal-cyan"></i>
                My Submitted Documents &amp; Status ({filteredDocs.length})
              </h3>
              <span className="text-[10px] font-black bg-brutal-bg px-2.5 py-0.5 border border-brutal-black rounded shadow-brutal-sm">
                User ID #USR-88219
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-brutal-yellow border-b-2.5 border-brutal-black text-brutal-black uppercase font-black sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 border-r-2 border-brutal-black">Domain</th>
                    <th className="p-2.5 border-r-2 border-brutal-black">Document Type</th>
                    <th className="p-2.5 border-r-2 border-brutal-black">File Name</th>
                    <th className="p-2.5 border-r-2 border-brutal-black">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-brutal-black text-brutal-black bg-white">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-bold">
                        No documents match the current domain filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-brutal-yellow/20 transition-all duration-150 animate-row-slide"
                      >
                        <td className="p-2.5 border-r-2 border-brutal-black uppercase text-[10px] font-black text-slate-700">
                          {doc.domainDisplay}
                        </td>
                        <td className="p-2.5 border-r-2 border-brutal-black">{doc.docTypeDisplay}</td>
                        <td className="p-2.5 border-r-2 border-brutal-black font-mono text-[11px]">
                          <i className={`${getFormatIconClass(doc.fileExt)} me-1.5`}></i>
                          {doc.fileName}
                        </td>
                        <td className="p-2.5 border-r-2 border-brutal-black">
                          <span
                            className={`neo-badge badge-${doc.status} text-[10px] px-2 py-0.5 rounded-md inline-block`}
                          >
                            {doc.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onInspectDocument(doc.id)}
                            className="neo-btn px-2.5 py-1 text-[10px] bg-brutal-yellow text-brutal-black uppercase hover:scale-105 active:scale-95"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
