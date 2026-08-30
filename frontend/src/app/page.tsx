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
import { MOCK_FORGERY_REPORT, MOCK_AUTHENTIC_REPORT } from "@/contracts/mock-data";
import { ForensicReport } from "@/contracts/api-spec";

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

    let generatedReport: ForensicReport | null = null;

    // Try Backend API (port 8001) → AI Engine (port 8000) → Next.js API Proxy (/api/verify-document)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    const aiEngineUrl = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1. Primary: backend/app/main.py (port 8001) — full 6-layer pipeline + Supabase persistence
      let res = await fetch(`${backendUrl}/api/verify-document`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(15000),
      }).catch(() => null);

      // 2. Secondary: ai_engine/server.py (port 8000) — standalone AI engine
      if (!res || !res.ok) {
        const formData2 = new FormData();
        formData2.append("file", file);
        res = await fetch(`${aiEngineUrl}/api/verify-document`, {
          method: "POST",
          body: formData2,
          signal: AbortSignal.timeout(15000),
        }).catch(() => null);
      }

      // 3. Tertiary: Next.js API Proxy route (/api/verify-document)
      if (!res || !res.ok) {
        const formData3 = new FormData();
        formData3.append("file", file);
        res = await fetch(`/api/verify-document`, {
          method: "POST",
          body: formData3,
          signal: AbortSignal.timeout(15000),
        }).catch(() => null);
      }

      if (res && res.ok) {
        generatedReport = await res.json();
      } else {
        const errJson = res ? await res.json().catch(() => null) : null;
        const msg = errJson?.error || "SherDetect Python backend service is offline. Please start Python backend on port 8001.";
        addToast(`Verification Error: ${msg}`, "danger");
        return;
      }
    } catch (err: any) {
      addToast(`Verification Error: Could not connect to SherDetect backend service (${err?.message || "Connection refused"}).`, "danger");
      return;
    }

    if (!generatedReport) {
      return;
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
    addToast(`Document "${fileName}" submitted for verification review!`, "success");
  };

  // Decision Callback from Reviewer View
  const handleMakeDecision = async (
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

    // Sync decision to Python Backend / Supabase
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    try {
      await fetch(`${backendUrl}/api/documents/${docId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decision,
          notes: notes,
          reviewerName: "Verifier Officer",
        }),
      }).catch(() => null);
    } catch (e) {
      // Graceful local sync fallback
    }
  };

  const handleInspectDocument = (docId: string) => {
    setCurrentRole("officer");
    addToast(`Switched to Reviewer View for Document #${docId}`, "info");
  };

  const pendingCount = documents.filter(
    (d) => d.status === "pending" || d.status === "under_review"
  ).length;

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-black antialiased selection:bg-brutal-yellow selection:text-brutal-black flex flex-col">
      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        pendingCount={pendingCount}
      />

      {/* Main Screen-Fitted Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Universal Multi-Domain Banner */}
        <DomainBanner
          activeDomainFilter={domainFilter}
          onSelectDomain={(domain) => setDomainFilter(domain)}
        />

        {/* Dynamic Connected Role Views */}
        <div className="transition-all duration-300">
          {currentRole === "customer" ? (
            <SubmitterView
              documents={documents}
              activeDomainFilter={domainFilter}
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
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastOverlay toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
