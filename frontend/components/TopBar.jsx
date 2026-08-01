"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { health } from "@/lib/api";

export default function TopBar() {
  const path = usePathname();
  const [badge, setBadge] = useState({ text: "DEMO DATA", cls: "badge-demo" });

  useEffect(() => {
    health()
      .then((h) => {
        if (!h.openai) setBadge({ text: "LIVE · ADD KEY", cls: "badge-live" });
        else setBadge({ text: "LIVE · " + (h.model || "GPT-4O-MINI").toUpperCase(), cls: "badge-live" });
      })
      .catch(() => setBadge({ text: "DEMO DATA", cls: "badge-demo" }));
  }, []);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/read", label: "🛡 Read" },
    { href: "/fight", label: "⚔ Fight" },
  ];

  return (
    <header className="topbar">
      <Link href="/" className="brand">⚖ FinePrint<span>AI Insurance Advocate</span></Link>
      <nav className="topnav">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} style={path === n.href ? { color: "var(--text)", borderColor: "var(--primary)", background: "rgba(99, 102, 241, 0.2)" } : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
      <span className={"badge " + badge.cls}>{badge.text}</span>
    </header>
  );
}