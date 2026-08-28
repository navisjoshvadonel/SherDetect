import React from "react";
import "./globals.css";

export const metadata = {
  title: "SherDetect — Multi-Domain AI Document Forensic & Verification Engine",
  description:
    "Autonomous document forensic audit suite for resumes, IDs, utility bills, degrees, legal contracts, and medical reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
