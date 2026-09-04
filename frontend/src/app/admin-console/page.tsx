"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sliders, 
  Download, 
  ArrowLeft, 
  Save, 
  Webhook, 
  Settings
} from "lucide-react";

export default function AdminConsolePage() {
  const [kycThreshold, setKycThreshold] = useState(40);
  const [financeThreshold, setFinanceThreshold] = useState(45);
  const [hrThreshold, setHrThreshold] = useState(60);
  const [webhookUrl, setWebhookUrl] = useState("https://core-banking.client.com/webhooks/sherdetect");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportCsv = () => {
    window.open("http://localhost:8001/api/audit-history/export?format=csv", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Bar (Neobrutalism) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-4 border-black bg-[#00F0FF] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-1">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 font-bold uppercase text-sm bg-white text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-cyan-100 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8" /> Sovereign Admin & Governance Console
            </h1>
            <p className="font-semibold text-sm">
              Manage multi-tenant risk thresholds, webhook integrations, and compliance export logs.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="bg-[#55FF55] hover:bg-green-400 text-black font-black uppercase text-sm px-5 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 self-start md:self-auto"
          >
            <Download className="w-5 h-5" /> Export Audit CSV Log
          </button>
        </div>

        {/* Saved Toast Banner */}
        {savedSuccess && (
          <div className="border-4 border-black bg-[#55FF55] p-4 text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <span>✅ Tenant Risk Thresholds & Webhook Configuration Saved Successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Configurable Risk Thresholds per Sector */}
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b-4 border-black pb-3">
              <h2 className="text-xl font-black uppercase flex items-center gap-2">
                <Sliders className="w-6 h-6 text-black" /> Sector Risk Sensitivity Thresholds
              </h2>
              <p className="font-bold text-xs text-gray-600 mt-1">
                Customize escalation risk tolerance thresholds per business domain.
              </p>
            </div>

            {/* KYC Slider */}
            <div className="space-y-2 bg-[#FFDE59] p-4 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between font-black uppercase text-sm">
                <span>KYC & Identity Sector Threshold</span>
                <span className="bg-black text-white px-2 py-0.5">{kycThreshold}% Risk</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="80" 
                value={kycThreshold} 
                onChange={(e) => setKycThreshold(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-xs font-bold text-gray-800">Strict tolerance. Escalates suspicious identity scans early.</p>
            </div>

            {/* Finance Slider */}
            <div className="space-y-2 bg-[#B57EDC] p-4 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between font-black uppercase text-sm">
                <span>Finance & Tax Sector Threshold</span>
                <span className="bg-black text-white px-2 py-0.5">{financeThreshold}% Risk</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="80" 
                value={financeThreshold} 
                onChange={(e) => setFinanceThreshold(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-xs font-bold text-gray-800">Strict tolerance for high-value invoice Benford anomalies.</p>
            </div>

            {/* HR Slider */}
            <div className="space-y-2 bg-[#00F0FF] p-4 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between font-black uppercase text-sm">
                <span>HR & Payroll Sector Threshold</span>
                <span className="bg-black text-white px-2 py-0.5">{hrThreshold}% Risk</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="90" 
                value={hrThreshold} 
                onChange={(e) => setHrThreshold(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-xs font-bold text-gray-800">Moderate tolerance for candidate paystubs and certificates.</p>
            </div>

          </div>

          {/* Section 2: Enterprise Webhooks & Integration */}
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-4 border-black pb-3">
                <h2 className="text-xl font-black uppercase flex items-center gap-2">
                  <Webhook className="w-6 h-6 text-black" /> Programmatic Webhook Dispatch
                </h2>
                <p className="font-bold text-xs text-gray-600 mt-1">
                  Deliver real-time verdicts directly to core banking, ATS, or ERP platforms.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-black uppercase text-xs">Client Webhook Listener URL</label>
                <input 
                  type="url" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-3 font-bold border-4 border-black bg-gray-50 focus:bg-yellow-50 outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="bg-[#FFFDF5] p-4 border-4 border-black space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black uppercase text-xs text-gray-700 block">Security Signature Protocol</span>
                <p className="font-bold text-xs text-black">
                  All webhook dispatches include an <code className="bg-black text-white px-1">X-SherDetect-Signature</code> HMAC-SHA256 header.
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="bg-[#55FF55] hover:bg-green-400 text-black font-black uppercase text-base p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 w-full mt-6"
            >
              <Save className="w-6 h-6" /> Save Enterprise Tenant Configuration
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
