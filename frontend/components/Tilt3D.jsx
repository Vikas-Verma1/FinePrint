"use client";
import { useRef } from "react";
import { cn } from "@/lib/cn";

export default function Tilt3D({ children, className, max = 9, glare = true }) {
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * (max * 2);
    const rx = -(py - 0.5) * (max * 2);
    el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
  }
  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div ref={ref} className={cn("tilt3d", className)} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
      {glare && <span className="glare" aria-hidden="true" />}
    </div>
  );
}