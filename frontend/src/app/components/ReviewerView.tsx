"use client";

import React, { useState } from "react";
import {
  DomainKey,
  DocumentItem,
  DocumentStatus,
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
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents.length > 0 ? documents[0].id : null
  );
  const [officerNotes, setOfficerNotes] = useState<string>("");

  const filteredDocs = documents.filter((doc) => {
    const matchDomain =
      selectedDomainFilter === "all" ? true : doc.domain === selectedDomainFilter;
    const matchStatus =
      selectedStatusFilter === "all" ? true : doc.status === selectedStatusFilter;
    return matchDomain && matchStatus;
  });

  const activeDoc = documents.find((d) => d.id === selectedDocId) || filteredDocs[0];

  const handleDecisionSubmit = (decision: "verified" | "rejected" | "resubmit") => {
    if (!activeDoc) return;
    onMakeDecision(activeDoc.id, decision, officerNotes);
    setOfficerNotes("");
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "under_review":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "verified":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "resubmit":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Reviewer Worklist Filters */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Verifier Forensic Worklist
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review submitted multi-domain documents, run ELA analysis, and execute verification decisions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Filter */}
          <select
            value={selectedDomainFilter}
            onChange={(e) => onDomainFilterChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
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

      {/* Main Reviewer Layout: Queue Grid + Active Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Queue List Table (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Inspection Queue ({filteredDocs.length})
              </span>
              <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                Live Audits
              </span>
            </div>

            <div className="overflow-y-auto max-h-[600px] divide-y divide-slate-800/60">
              {filteredDocs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No documents match the active filter criteria.
                </p>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-4 cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-cyan-500/10 border-l-4 border-l-cyan-400"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            #{doc.id}
                          </span>
                          <span className="font-bold text-xs text-slate-200 truncate">
                            {doc.customerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {doc.docTypeDisplay} &bull;{" "}
                          <span className="font-mono text-slate-500">{doc.fileName}</span>
                        </p>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {doc.domainDisplay}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase shrink-0 ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Active Inspection Panel & Decision Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {activeDoc ? (
            <>
              {/* Document Header info */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                      #{activeDoc.id}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">{activeDoc.customerName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Category: <span className="text-slate-200 font-semibold">{activeDoc.docTypeDisplay}</span> ({activeDoc.domainDisplay})
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                    activeDoc.status
                  )}`}
                >
                  {activeDoc.status.replace("_", " ")}
                </span>
              </div>

              {/* Forensic Inspection Canvas Component */}
              <ForensicCanvas
                report={activeDoc.report}
                fileName={activeDoc.fileName}
                docId={activeDoc.id}
              />

              {/* Verification Decision Form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Verifier Decision & Audit Notes
                </h3>

                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter audit verification comments, credential check notes, or rejection rationale..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleDecisionSubmit("verified")}
                    className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>

                  <button
                    onClick={() => handleDecisionSubmit("resubmit")}
                    className="py-3 px-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resubmit
                  </button>

                  <button
                    onClick={() => handleDecisionSubmit("rejected")}
                    className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a document from the queue to inspect forensic results.
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <AuditTrail logs={auditLogs} />
    </div>
  );
};
