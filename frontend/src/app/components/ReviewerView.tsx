"use client";

import React, { useState } from "react";
import {
  DomainKey,
  DocumentItem,
  DOMAIN_LABELS,
  AuditLogItem,
} from "../types";
import { ForensicCanvas } from "./ForensicCanvas";
import { AuditTrail } from "./AuditTrail";

interface ReviewerViewProps {
  documents: DocumentItem[];
  auditLogs: AuditLogItem[];
  selectedDomainFilter: string;
  onDomainFilterChange: (domain: string) => void;
  onMakeDecision: (
    docId: string,
    decision: "verified" | "rejected" | "resubmit",
    notes: string
  ) => void;
}

export const ReviewerView: React.FC<ReviewerViewProps> = ({
  documents,
  auditLogs,
  selectedDomainFilter,
  onDomainFilterChange,
  onMakeDecision,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents.length > 0 ? documents[0].id : null
  );
  const [officerNotes, setOfficerNotes] = useState<string>("");

  const filteredDocs = documents.filter((doc) => {
    const matchDomain =
      selectedDomainFilter === "all" ? true : doc.domain === selectedDomainFilter;
    const matchStatus =
      selectedStatusFilter === "all" ? true : doc.status === selectedStatusFilter;
    const matchQuery =
      searchQuery.trim() === "" ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.includes(searchQuery);
    return matchDomain && matchStatus && matchQuery;
  });

  const activeDoc = documents.find((d) => d.id === selectedDocId) || filteredDocs[0];

  const handleDecisionSubmit = (decision: "verified" | "rejected" | "resubmit") => {
    if (!activeDoc) return;
    onMakeDecision(activeDoc.id, decision, officerNotes);
    setOfficerNotes("");
  };

  const handleExportAuditJSON = () => {
    if (!activeDoc || !activeDoc.report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeDoc.report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SherDetect_Audit_${activeDoc.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getFormatIconClass = (ext: string) => {
    const cleanExt = ext.toLowerCase();
    if (["pdf"].includes(cleanExt)) return "fa-solid fa-file-pdf text-rose-600";
    if (["doc", "docx"].includes(cleanExt)) return "fa-solid fa-file-word text-blue-600";
    if (["xls", "xlsx", "csv"].includes(cleanExt)) return "fa-solid fa-file-excel text-emerald-600";
    if (["png", "jpg", "jpeg", "webp"].includes(cleanExt)) return "fa-solid fa-file-image text-purple-600";
    return "fa-solid fa-file text-slate-600";
  };

  return (
    <div className="space-y-4">
      {/* Officer Worklist Header & Filter Bar */}
      <div className="neo-card p-3 bg-white space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-brutal-black flex items-center gap-2 uppercase">
              <i className="fa-solid fa-user-check text-brutal-purple animate-icon-pop"></i>
              Verifier Inspection &amp; Audit Worklist
            </h2>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">
              Review incoming documents, analyze pixel ELA heatmaps, and execute verification decisions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue..."
                className="neo-input pl-8 pr-2 py-1 text-xs font-bold text-brutal-black w-40"
              />
            </div>

            {/* Domain Filter */}
            <select
              value={selectedDomainFilter}
              onChange={(e) => onDomainFilterChange(e.target.value)}
              className="neo-input px-2 py-1 text-xs font-black text-brutal-black"
            >
              <option value="all">All Domains</option>
              {(Object.keys(DOMAIN_LABELS) as DomainKey[]).map((key) => (
                <option key={key} value={key}>
                  {DOMAIN_LABELS[key]}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="neo-input px-2 py-1 text-xs font-black text-brutal-black"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="resubmit">Resubmit</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reviewer Worklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Document Worklist Table */}
        <div className="lg:col-span-5 neo-card overflow-hidden flex flex-col justify-between bg-white">
          <div>
            <div className="p-2.5 border-b-2.5 border-brutal-black flex items-center justify-between bg-brutal-cyan">
              <span className="font-black text-brutal-black text-xs uppercase flex items-center">
                <i className="fa-solid fa-list-check me-1.5"></i>
                Queue ({filteredDocs.length})
              </span>
              <span className="text-[9.5px] font-black bg-white px-2 py-0.5 border border-brutal-black rounded">
                Live Audits
              </span>
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-brutal-bg border-b-2.5 border-brutal-black text-brutal-black uppercase font-black sticky top-0 z-10">
                  <tr>
                    <th className="p-2 border-r-2 border-brutal-black">ID</th>
                    <th className="p-2 border-r-2 border-brutal-black">Domain &amp; Submitter</th>
                    <th className="p-2 border-r-2 border-brutal-black">Doc Type</th>
                    <th className="p-2 border-r-2 border-brutal-black">Status</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-brutal-black text-brutal-black bg-white">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-5 text-center text-slate-500 font-bold">
                        No queue items match filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => {
                      const isSelected = activeDoc?.id === doc.id;
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`hover:bg-brutal-yellow/20 transition-all duration-150 cursor-pointer animate-row-slide group ${
                            isSelected ? "bg-brutal-yellow/30 font-black border-l-4 border-l-brutal-black" : ""
                          }`}
                        >
                          <td className="p-2 border-r-2 border-brutal-black font-mono font-black text-[10.5px]">
                            #{doc.id}
                          </td>
                          <td className="p-2 border-r-2 border-brutal-black">
                            <div className="font-extrabold text-brutal-black text-[11px]">
                              {doc.customerName}
                            </div>
                            <div className="text-[9px] font-black text-slate-500 uppercase">
                              {doc.domainDisplay}
                            </div>
                          </td>
                          <td className="p-2 border-r-2 border-brutal-black text-[10.5px]">
                            {doc.docTypeDisplay}
                          </td>
                          <td className="p-2 border-r-2 border-brutal-black">
                            <span
                              className={`neo-badge badge-${doc.status} text-[9px] px-1.5 py-0.5 rounded inline-block`}
                            >
                              {doc.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              className="neo-btn px-2 py-0.5 text-[9.5px] bg-brutal-yellow text-brutal-black uppercase hover:scale-105 group-hover:bg-brutal-cyan transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Inspection & Forensic Canvas Panel */}
        <div className="lg:col-span-7 space-y-4">
          {activeDoc ? (
            <>
              {/* Active Document Header */}
              <div className="neo-card p-3.5 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b-2 border-brutal-black pb-2">
                  <div>
                    <span className="text-[9.5px] font-mono font-black text-brutal-purple bg-brutal-purple/20 px-2 py-0.5 border border-brutal-black rounded">
                      #DOC-{activeDoc.id}
                    </span>
                    <h3 className="font-black text-brutal-black text-sm mt-0.5">
                      {activeDoc.customerName}
                    </h3>
                    <p className="text-[9.5px] font-bold text-slate-600">
                      {activeDoc.docTypeDisplay} &bull; {activeDoc.domainDisplay}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportAuditJSON}
                      className="neo-btn px-2 py-1 bg-brutal-bg text-brutal-black text-[10px] uppercase font-black flex items-center gap-1 hover:bg-brutal-yellow"
                      title="Export Official Forensic Audit JSON Report"
                    >
                      <i className="fa-solid fa-download text-xs"></i>
                      Export Report
                    </button>
                    <span className={`neo-badge badge-${activeDoc.status} text-xs px-2.5 py-1 rounded`}>
                      {activeDoc.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Preview Metadata Box */}
                <div className="rounded-xl border-2 border-brutal-black bg-brutal-bg p-2.5 text-center space-y-1.5 shadow-brutal-sm">
                  <div className="text-[10.5px] font-black text-brutal-black flex items-center justify-between border-b border-brutal-black pb-1">
                    <span>{activeDoc.docTypeDisplay}</span>
                    <span className="font-mono bg-white px-2 py-0.5 border border-brutal-black rounded text-[9.5px]">
                      {activeDoc.fileName}
                    </span>
                  </div>

                  <div className="h-20 rounded-lg bg-white border border-brutal-black flex flex-col items-center justify-center relative overflow-hidden p-2">
                    <i
                      className={`${getFormatIconClass(activeDoc.fileExt)} text-2xl mb-1 transition-transform hover:scale-125 duration-300`}
                    ></i>
                    <span className="text-[9.5px] font-black bg-brutal-yellow px-2 py-0.5 rounded border border-brutal-black uppercase">
                      {activeDoc.fileExt.toUpperCase()} Document File
                    </span>
                  </div>
                </div>

                {/* Forensic Canvas Component */}
                <ForensicCanvas
                  report={activeDoc.report}
                  fileName={activeDoc.fileName}
                  docId={activeDoc.id}
                />

                {/* Decision Form */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[10.5px] font-black text-brutal-black uppercase">
                    Verifier Notes &amp; Compliance Trail Comments *
                  </label>
                  <textarea
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    rows={2}
                    className="w-full neo-input p-2 text-xs font-bold text-brutal-black"
                    placeholder="Enter verification comments, credential check notes, or reason for rejection/resubmission..."
                  />

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDecisionSubmit("verified")}
                      className="neo-btn py-2 bg-brutal-green text-brutal-black text-xs font-black uppercase flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <i className="fa-solid fa-circle-check text-sm text-brutal-black"></i>
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecisionSubmit("resubmit")}
                      className="neo-btn py-2 bg-brutal-orange text-brutal-black text-xs font-black uppercase flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <i className="fa-solid fa-arrows-rotate text-sm text-brutal-black"></i>
                      Resubmit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecisionSubmit("rejected")}
                      className="neo-btn py-2 bg-brutal-pink text-brutal-black text-xs font-black uppercase flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all text-white"
                    >
                      <i className="fa-solid fa-circle-xmark text-sm text-white"></i>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="neo-card p-8 text-center text-slate-600 bg-white font-bold">
              Select a document from the queue to inspect verifier details.
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <AuditTrail logs={auditLogs} />
    </div>
  );
};
