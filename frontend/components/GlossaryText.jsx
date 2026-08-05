"use client";
import { useEffect, useMemo, useState } from "react";
import { GLOSSARY, glossaryRegex, getGlossDef } from "@/lib/glossary";
import { getLang } from "@/lib/lang";

// Renders text with insurance jargon wrapped in hover/tap tooltip spans.
// Tooltips follow the current language (English / Hindi).
export default function GlossaryText({ text, className }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    setLangState(getLang());
    const onLang = (e) => setLangState(e.detail);
    window.addEventListener("fineprint:lang", onLang);
    return () => window.removeEventListener("fineprint:lang", onLang);
  }, []);

  const nodes = useMemo(() => {
    if (!text) return null;
    const rx = glossaryRegex();
    const out = [];
    let last = 0;
    let m;
    let k = 0;

    while ((m = rx.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const term = m[0];
      const def = getGlossDef(GLOSSARY[term.toLowerCase()], lang);
      out.push(
        <span
          key={k++}
          className="gloss"
          tabIndex={0}
          data-def={def}
          aria-label={def}
          onClick={(e) => {
            const el = e.currentTarget;
            if (document.activeElement === el) el.blur();
            else el.focus();
          }}
        >
          {term}
        </span>
      );
      last = m.index + term.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [text, lang]);

  return <span className={className}>{nodes}</span>;
}









// "use client";
// import { useMemo } from "react";
// import { GLOSSARY, glossaryRegex } from "@/lib/glossary";

// // Renders text with insurance jargon wrapped in hover/tap tooltip spans.
// export default function GlossaryText({ text, className }) {
//   const nodes = useMemo(() => {
//     if (!text) return null;
//     const rx = glossaryRegex();
//     const out = [];
//     let last = 0;
//     let m;
//     let k = 0;

//     while ((m = rx.exec(text))) {
//       if (m.index > last) out.push(text.slice(last, m.index));
//       const term = m[0];
//       const def = GLOSSARY[term.toLowerCase()] || "";
//       out.push(
//         <span
//           key={k++}
//           className="gloss"
//           tabIndex={0}
//           data-def={def}
//           aria-label={def}
//           onClick={(e) => {
//             // tap-to-toggle for touch devices
//             const el = e.currentTarget;
//             if (document.activeElement === el) el.blur();
//             else el.focus();
//           }}
//         >
//           {term}
//         </span>
//       );
//       last = m.index + term.length;
//     }
//     if (last < text.length) out.push(text.slice(last));
//     return out;
//   }, [text]);

//   return <span className={className}>{nodes}</span>;
// }