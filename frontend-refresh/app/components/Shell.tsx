"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/submit", label: "New audit" },
  { href: "/documents", label: "Documents" },
  { href: "/review", label: "Review queue" },
  { href: "/audit", label: "Audit trail" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">S</span><span>SherDetect</span></Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>{link.label}</Link>)}
        </nav>
        <div className="status-pill"><span className="status-dot" /> Engine online</div>
      </header>
      <main className="page-wrap">{children}</main>
      <footer className="footer"><span>SHERDETECT / FORENSIC WORKSPACE</span><span>Protected review environment</span></footer>
    </div>
  );
}
