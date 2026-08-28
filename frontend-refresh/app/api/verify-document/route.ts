import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const urls = [process.env.BACKEND_URL || "http://localhost:8001", process.env.AI_ENGINE_URL || "http://localhost:8000"];
  for (const url of urls) {
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      const response = await fetch(`${url}/api/verify-document`, { method: "POST", body });
      if (response.ok) return NextResponse.json(await response.json());
    } catch {
      // Continue to the next configured backend.
    }
  }
  return NextResponse.json({ error: "Forensic backend is offline. Start the service on port 8001." }, { status: 503 });
}
