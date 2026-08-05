"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { health } from "@/lib/api";

export default function TopBar() {
  const path = usePathname();
  const [badge, setBadge] = useState({ text: "STARTING…", cls: "badge-demo" });

  useEffect(() => {
    let alive = true;
    let timer = null;

    const check = () => {
      health()
        .then((h) => {
          if (!alive) return;
          // Any successful health response = backend is LIVE.
          setBadge(
            h.llm || h.openai
              ? { text: "LIVE · " + (h.model || "AI").toUpperCase(), cls: "badge-live" }
              : { text: "LIVE · NO KEY", cls: "badge-demo" }
          );
        })
        .catch(() => {
          if (!alive) return;
          setBadge({ text: "OFFLINE", cls: "badge-demo" });
          timer = setTimeout(check, 3000); // keep retrying → flips to LIVE as soon as backend wakes
        });
    };

    check();
    return () => { alive = false; if (timer) clearTimeout(timer); };
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









// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";
// import { health } from "@/lib/api";

// export default function TopBar() {
//   const path = usePathname();
//   const [badge, setBadge] = useState({ text: "OFFLINE", cls: "badge-demo" });

//   useEffect(() => {
//     health()
//       .then((h) => setBadge(h.llm || h.openai ? { text: "LIVE · " + (h.model || "AI").toUpperCase(), cls: "badge-live" } : { text: "LIVE · NO KEY", cls: "badge-demo" }))
//       .catch(() => setBadge({ text: "OFFLINE", cls: "badge-demo" }));
//   }, []);

//   const nav = [
//     { href: "/", label: "Home" },
//     { href: "/read", label: "Read" },
//     { href: "/fight", label: "Fight" },
//   ];

//   return (
//     <header className="topbar">
//       <Link href="/" className="brand"><span className="mark">⚖</span>FinePrint<span>AI Insurance Advocate</span></Link>
//       <nav className="topnav">
//         {nav.map((n) => (
//           <Link key={n.href} href={n.href} style={path === n.href ? { color: "var(--text)", borderColor: "var(--line-2)", background: "var(--panel)" } : undefined}>{n.label}</Link>
//         ))}
//       </nav>
//       <span className={"badge " + badge.cls}>{badge.text}</span>
//     </header>
//   );
// }