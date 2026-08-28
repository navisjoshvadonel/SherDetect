import React from "react";
import "./globals.css";

export const metadata = {
  title: "SherDetect — Universal Multi-Domain Document Verification Platform",
  description:
    "Multi-Domain Document Verification System — Resumes, Bills, IDs, Credentials & Legal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-brutal-yellow selection:text-brutal-black bg-brutal-bg">
        {children}
      </body>
    </html>
  );
}
