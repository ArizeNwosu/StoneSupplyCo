"use client";

import { useMemo, useRef, useState } from "react";
import type { MaterialSummary } from "@/types/material";
import { StoneThumbnail } from "./StoneThumbnail";

type Props = {
  onSelect: (material: MaterialSummary) => void;
  selected?: MaterialSummary | null;
  label?: string;
};

export function StoneSearch({ onSelect, selected, label = "Stone material" }: Props) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const loaded = useRef(false);

  const loadMaterials = async () => {
    if (loaded.current || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/materials?availability=available&limit=100");
      if (!response.ok) throw new Error("Unable to load stones");
      setMaterials((await response.json()) ?? []);
      loaded.current = true;
    } finally {
      setLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || normalized === selected?.name.toLowerCase()) return materials;
    return materials.filter((material) =>
      [material.name, material.material_type, material.color_family, material.finish, ...material.tags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [materials, query, selected?.name]);

  const selectMaterial = (mat: MaterialSummary) => {
    setQuery(mat.name);
    setActiveIndex(0);
    setOpen(false);
    onSelect(mat);
  };

  return (
    <div className="finder-field stone-search">
      <label htmlFor="visualizer-stone-search">{label}</label>
      <div className="stone-search__input-wrap">
        <input
          id="visualizer-stone-search"
          role="combobox"
          aria-expanded={open}
          aria-controls="visualizer-stone-options"
          aria-autocomplete="list"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
            void loadMaterials();
          }}
          onFocus={() => {
            setOpen(true);
            void loadMaterials();
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
              event.preventDefault();
              selectMaterial(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search or browse all available stones"
          autoComplete="off"
        />
        <span className="stone-search__hint" aria-hidden="true">⌄</span>
      </div>
      {open && (
        <div id="visualizer-stone-options" role="listbox" className="stone-search__menu">
          <div className="stone-search__menu-heading">
            <span>{query ? "Matching stones" : "All available stones"}</span>
            {!loading && <span>{suggestions.length}</span>}
          </div>
          {loading && <p className="stone-search__status">Loading the collection…</p>}
          {!loading && suggestions.length === 0 && (
            <p className="stone-search__status">No stones match that search.</p>
          )}
          {suggestions.map((mat) => (
            <button
              key={mat.slug}
              type="button"
              role="option"
              aria-selected={selected?.slug === mat.slug}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(suggestions.indexOf(mat))}
              onClick={() => selectMaterial(mat)}
              className={`stone-search__option${suggestions[activeIndex]?.slug === mat.slug ? " is-active" : ""}`}
            >
              <StoneThumbnail name={mat.name} slug={mat.slug} imageUrl={mat.image_urls?.[0]} colorFamily={mat.color_family} size="large" />
              <span className="stone-search__copy">
                <strong>{mat.name}</strong>
                <small>{mat.material_type} · {mat.color_family ?? "Natural"} · {mat.finish}</small>
              </span>
              {selected?.slug === mat.slug && <span className="stone-search__check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
