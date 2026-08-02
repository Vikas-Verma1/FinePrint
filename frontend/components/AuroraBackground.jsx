"use client";
import { useEffect, useRef } from "react";

export default function AuroraBackground() {
  const w1 = useRef(null), w2 = useRef(null), w3 = useRef(null);

  useEffect(() => {
    let raf = 0;
    function onMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        if (w1.current) w1.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
        if (w2.current) w2.current.style.transform = `translate(${x * -42}px, ${y * 22}px)`;
        if (w3.current) w3.current.style.transform = `translate(${x * 22}px, ${y * -32}px)`;
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="aurora" aria-hidden="true">
      <div className="grid-mask" />
      <div ref={w1} className="orb-wrap"><div className="orb orb1" /></div>
      <div ref={w2} className="orb-wrap"><div className="orb orb2" /></div>
      <div ref={w3} className="orb-wrap"><div className="orb orb3" /></div>
    </div>
  );
}