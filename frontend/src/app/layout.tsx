import React from "react";
import "./globals.css";

export const metadata = {
  title: "SherDetect — AI-Powered Document Integrity & Forgery Detection Platform",
  description:
    "SherDetect AI Forensics Suite — Advanced Multi-Domain Document Integrity & Forgery Detection Engine",
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
      <body className="min-h-screen flex flex-col antialiased selection:bg-brutal-yellow selection:text-brutal-black bg-brutal-bg text-brutal-black">
        {children}
      </body>
    </html>
  );
}
