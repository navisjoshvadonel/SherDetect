"use client";

import React, { useState } from "react";
import { Header } from "./components/Header";
import { DomainBanner } from "./components/DomainBanner";
import { SubmitterView } from "./components/SubmitterView";
import { ReviewerView } from "./components/ReviewerView";
import { ToastOverlay } from "./components/ToastOverlay";
import {
  DomainKey,
  DocumentItem,
  AuditLogItem,
  ToastMessage,
  DOMAIN_CATEGORIES,
  DOMAIN_LABELS,
} from "./types";
import { MOCK_FORGERY_REPORT, MOCK_AUTHENTIC_REPORT } from "../../../contracts/mock-data";
import { ForensicReport } from "../../../contracts/api-spec";

export default function ForensicDashboard() {
  const [currentRole, setCurrentRole] = useState<"customer" | "officer">("customer");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Seed documents incorporating multi-domain specs from AAA
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: "101",
      domain: "hr_employment",
      domainDisplay: DOMAIN_LABELS["hr_employment"],
      docType: "resume",
      docTypeDisplay: "Senior Engineer Resume",
      fileName: "Alex_Taylor_Resume_2026.pdf",
      fileExt: "pdf",
      uploadDate: "2026-08-28 09:30:15",
      status: "pending",
      notes: "",
      customerName: "Alex Taylor",
      report: MOCK_FORGERY_REPORT,
    },
    {
      id: "102",
      domain: "billing_finance",
      domainDisplay: DOMAIN_LABELS["billing_finance"],
      docType: "utility_bill",
      docTypeDisplay: "Electricity Bill Statement",
      fileName: "Electricity_Bill_July_2026.pdf",
      fileExt: "pdf",
      uploadDate: "2026-08-28 09:45:00",
      status: "pending",
      notes: "",
      customerName: "Alex Taylor",
      report: MOCK_AUTHENTIC_REPORT,
    },
    {
      id: "103",
      domain: "identity_kyc",
      domainDisplay: DOMAIN_LABELS["identity_kyc"],
      docType: "passport",
      docTypeDisplay: "Passport Identity Scan",
      fileName: "Passport_Scan_Taylor.jpg",
      fileExt: "jpg",
      uploadDate: "2026-08-27 14:10:00",
      status: "verified",
      notes: "Passport identity details verified.",
      customerName: "Alex Taylor",
      report: MOCK_AUTHENTIC_REPORT,
    },
    {
      id: "104",
      domain: "education_academics",
      domainDisplay: DOMAIN_LABELS["education_academics"],
      docType: "degree_diploma",
      docTypeDisplay: "Computer Science Degree",
      fileName: "CS_Diploma_Scan.docx",
      fileExt: "docx",
      uploadDate: "2026-08-26 11:20:00",
      status: "pending",
      notes: "",
      customerName: "Alex Taylor",
      report: MOCK_FORGERY_REPORT,
    },
  ]);

  // Seed audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: "log-1",
      timestamp: "2026-08-28 09:45:00",
      docId: "102",
      action: "submitted",
      user: "Alex Taylor",
      note: "Uploaded electricity bill statement for verification audit.",
    },
    {
      id: "log-2",
      timestamp: "2026-08-28 09:30:15",
      docId: "101",
      action: "submitted",
      user: "Alex Taylor",
      note: "Uploaded resume PDF for HR verification audit.",
    },
    {
      id: "log-3",
      timestamp: "2026-08-27 15:00:00",
      docId: "103",
      action: "verified",
      user: "Verifier Sarah Jenkins",
      note: "Passport scan verified intact without ELA tampering.",
    },
  ]);

  const addToast = (message: string, type: ToastMessage["type"] = "info") => {
    const newToast: ToastMessage = {
      id: "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Submit new document callback
  const handleSubmitDocument = async (
    domain: DomainKey,
    docType: string,
    file: File
  ) => {
    const fileName = file.name;
    const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin";
    const docTypeObj = DOMAIN_CATEGORIES[domain]?.find((opt) => opt.val === docType);
    const docTypeLabel = docTypeObj ? docTypeObj.label : docType;

    let generatedReport: ForensicReport = MOCK_FORGERY_REPORT;

    // Try backend API call if available
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8000/api/verify-document", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        generatedReport = await res.json();
      } else {
        generatedReport = fileName.toLowerCase().includes("auth")
          ? MOCK_AUTHENTIC_REPORT
          : MOCK_FORGERY_REPORT;
      }
    } catch {
      generatedReport = fileName.toLowerCase().includes("auth")
        ? MOCK_AUTHENTIC_REPORT
        : MOCK_FORGERY_REPORT;
    }

    const newDocId = (105 + documents.length).toString();
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    const newDoc: DocumentItem = {
      id: newDocId,
      domain: domain,
      domainDisplay: DOMAIN_LABELS[domain],
      docType: docType,
      docTypeDisplay: docTypeLabel,
      fileName: fileName,
      fileExt: ext,
      fileSizeBytes: file.size,
      uploadDate: nowStr,
      status: "pending",
      notes: "",
      customerName: "Alex Taylor",
      report: generatedReport,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    const newLog: AuditLogItem = {
      id: "log-" + Date.now(),
      timestamp: nowStr,
      docId: newDocId,
      action: "submitted",
      user: "Alex Taylor",
      note: `Submitted "${fileName}" (${DOMAIN_LABELS[domain]} - ${docTypeLabel}) for verification review.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    addToast(`Document "${fileName}" successfully submitted for verification audit!`, "success");
  };

  // Decision Callback from Reviewer View
  const handleMakeDecision = (
    docId: string,
    decision: "verified" | "rejected" | "resubmit",
    notes: string
  ) => {
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: decision,
            notes: notes || `Marked as ${decision} by Reviewer Officer.`,
          };
        }
        return doc;
      })
    );

    const actionText =
      decision === "verified"
        ? "Approve Verified"
        : decision === "rejected"
        ? "Reject Forgery"
        : "Request Resubmission";

    const newLog: AuditLogItem = {
      id: "log-" + Date.now(),
      timestamp: nowStr,
      docId: docId,
      action: decision,
      user: "Verifier Officer",
      note: `${actionText} for Document #${docId}. Note: ${notes || "No notes provided"}`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    addToast(
      `Document #${docId} status updated to "${decision.toUpperCase()}".`,
      decision === "verified" ? "success" : decision === "rejected" ? "danger" : "warning"
    );
  };

  const handleInspectDocument = (docId: string) => {
    setCurrentRole("officer");
    addToast(`Switched to Reviewer View for Document #${docId}`, "info");
  };

  const pendingCount = documents.filter(
    (d) => d.status === "pending" || d.status === "under_review"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        pendingCount={pendingCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Multi-Domain Banner */}
        <DomainBanner
          activeDomainFilter={domainFilter}
          onSelectDomain={(domain) => setDomainFilter(domain)}
        />

        {/* Dynamic Role Views */}
        {currentRole === "customer" ? (
          <SubmitterView
            documents={documents}
            onSubmitDocument={handleSubmitDocument}
            onInspectDocument={handleInspectDocument}
          />
        ) : (
          <ReviewerView
            documents={documents}
            auditLogs={auditLogs}
            selectedDomainFilter={domainFilter}
            onDomainFilterChange={setDomainFilter}
            onMakeDecision={handleMakeDecision}
          />
        )}
      </main>

      {/* Toast Notifications */}
      <ToastOverlay toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
