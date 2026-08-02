"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { health } from "@/lib/api";

export default function TopBar() {
  const path = usePathname();
  const [badge, setBadge] = useState({ text: "OFFLINE", cls: "badge-demo" });

  useEffect(() => {
    health()
      .then((h) => setBadge(h.llm || h.openai ? { text: "LIVE · " + (h.model || "AI").toUpperCase(), cls: "badge-live" } : { text: "LIVE · NO KEY", cls: "badge-demo" }))
      .catch(() => setBadge({ text: "OFFLINE", cls: "badge-demo" }));
  }, []);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/read", label: "Read" },
    { href: "/fight", label: "Fight" },
  ];

  return (
    <header className="topbar">
      <Link href="/" className="brand"><span className="mark">⚖</span>FinePrint<span>AI Insurance Advocate</span></Link>
      <nav className="topnav">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} style={path === n.href ? { color: "var(--text)", borderColor: "var(--line-2)", background: "var(--panel)" } : undefined}>{n.label}</Link>
        ))}
      </nav>
      <span className={"badge " + badge.cls}>{badge.text}</span>
    </header>
  );
}