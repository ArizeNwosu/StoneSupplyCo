"use client";

import { useEffect, useState } from "react";
import { getSavedSlugs, toggleSaved } from "@/lib/projects";

type Props = {
  slug: string;
  label?: boolean;
};

export function SaveButton({ slug, label = true }: Props) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(getSavedSlugs().includes(slug));
  }, [slug]);

  const handleToggle = () => {
    const next = toggleSaved(slug);
    setSaved(next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleToggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save material"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: saved ? "var(--color-ink)" : "transparent",
        color: saved ? "var(--color-white)" : "var(--color-ink)",
        border: "1px solid var(--color-ink)",
        borderRadius: "var(--radius-card)",
        padding: "0.55rem 1.1rem",
        fontSize: "0.82rem",
        letterSpacing: "0.03em",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {label && (saved ? "Saved" : "Save")}
    </button>
  );
}
