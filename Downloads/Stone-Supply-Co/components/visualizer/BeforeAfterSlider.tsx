"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
};

export function BeforeAfterSlider({ beforeSrc, afterSrc, alt }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(x);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "66.67%",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        cursor: "col-resize",
        userSelect: "none",
        touchAction: "none",
        border: "1px solid var(--color-line)",
      }}
    >
      {/* After (full) */}
      <Image src={afterSrc} alt={`${alt} — after`} fill sizes="(max-width: 768px) 100vw, 52rem" style={{ objectFit: "cover" }} />

      {/* Before (clipped) */}
      <div style={{ position: "absolute", inset: 0, width: `${position}%`, overflow: "hidden" }}>
        <Image src={beforeSrc} alt={`${alt} — before`} fill sizes="(max-width: 768px) 100vw, 52rem" style={{ objectFit: "cover" }} />
      </div>

      {/* Slider line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: "3px",
          background: "var(--color-white)",
          boxShadow: "0 0 6px rgba(0,0,0,0.4)",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      />

      {/* Slider handle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${position}%`,
          transform: "translate(-50%, -50%)",
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          background: "var(--color-white)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--color-ink)",
        }}
      >
        ◄►
      </div>

      {/* Labels */}
      <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "rgba(23,24,21,0.75)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", zIndex: 4 }}>
        Before
      </div>
      <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "rgba(23,24,21,0.75)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", zIndex: 4 }}>
        After
      </div>
    </div>
  );
}
