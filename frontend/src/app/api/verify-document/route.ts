import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js API Proxy Handler: /api/verify-document
 * -----------------------------------------------
 * Proxies incoming multipart document verification requests directly to the
 * production Python Forensic Backend API (backend/app/main.py on port 8001 or ai_engine on port 8000).
 *
 * Replaces demo stub logic with real 6-layer forensic pipeline execution.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for inspection" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    const aiEngineUrl = process.env.AI_ENGINE_URL || process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";

    const arrayBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([arrayBuffer], { type: file.type || "application/octet-stream" });

    // 1. Primary Attempt: Send to Python FastAPI Backend (port 8001) — 6-layer pipeline + Supabase
    try {
      const primaryForm = new FormData();
      primaryForm.append("file", fileBlob, file.name);

      const res = await fetch(`${backendUrl}/api/verify-document`, {
        method: "POST",
        body: primaryForm,
      });

      if (res.ok) {
        const report = await res.json();
        return NextResponse.json(report);
      }
    } catch {
      // Port 8001 unreachable, try port 8000
    }

    // 2. Fallback Attempt: Send to Standalone AI Engine (port 8000)
    try {
      const fallbackForm = new FormData();
      fallbackForm.append("file", fileBlob, file.name);

      const res = await fetch(`${aiEngineUrl}/api/verify-document`, {
        method: "POST",
        body: fallbackForm,
      });

      if (res.ok) {
        const report = await res.json();
        return NextResponse.json(report);
      }
    } catch {
      // Port 8000 also unreachable
    }

    return NextResponse.json(
      {
        error:
          "SherDetect Python Forensic Backend (ports 8001 / 8000) is offline. Please start the backend with: python -m uvicorn backend.app.main:app --port 8001",
      },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
