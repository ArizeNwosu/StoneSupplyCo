"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import type { MaterialSummary } from "@/types/material";

type Props = {
  onSelect: (material: MaterialSummary) => void;
  selected?: MaterialSummary | null;
  label?: string;
};

export function StoneSearch({ onSelect, selected, label = "Stone material" }: Props) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [suggestions, setSuggestions] = useState<MaterialSummary[]>([]);
  const [open, setOpen] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setOpen(true);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/materials?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  const selectMaterial = (mat: MaterialSummary) => {
    setQuery(mat.name);
    setSuggestions([]);
    setOpen(false);
    onSelect(mat);
  };

  return (
    <div className="finder-field" style={{ position: "relative" }}>
      <label>{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search — e.g., Calacatta, Blue Bahia…"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--color-white)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          {suggestions.map((mat) => (
            <button
              key={mat.slug}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectMaterial(mat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--color-line)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {mat.image_urls?.[0] && (
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    position: "relative",
                    borderRadius: "2px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={mat.image_urls[0]}
                    alt={mat.name}
                    fill
                    sizes="40px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink)", fontWeight: 500 }}>
                  {mat.name}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-stone-dark)" }}>
                  {mat.material_type} · {mat.finish}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
