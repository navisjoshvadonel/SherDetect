import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./components/Nav";
export const metadata: Metadata = { title: "SherDetect | Clear evidence", description: "Minimal document forensic review workspace" };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Nav />{children}<footer>SHERDETECT / DOCUMENT FORENSICS <span>engine online</span></footer></body></html>; }
