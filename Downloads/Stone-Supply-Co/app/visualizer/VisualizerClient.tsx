"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { MaterialSummary } from "@/types/material";

const ROOMS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "floor", label: "Floor" },
  { value: "wall", label: "Feature wall" },
  { value: "outdoor", label: "Outdoor" },
];

type PreviewData = {
  type: "gradient";
  colors: string[];
  texture_url: string | null;
  material_type: string;
  finish: string;
};

type VisualizeResult = {
  slug: string;
  name: string;
  room: string;
  room_label: string;
  preview: PreviewData;
  note: string;
};

export function VisualizerClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("slug") ?? "";

  const [query, setQuery] = useState(initialSlug);
  const [suggestions, setSuggestions] = useState<MaterialSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [selectedName, setSelectedName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("kitchen");
  const [result, setResult] = useState<VisualizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  // Auto-visualize if slug from URL
  useEffect(() => {
    if (initialSlug) {
      handleVisualize(initialSlug, "kitchen");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/materials?q=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.materials ?? []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const selectMaterial = (mat: MaterialSummary) => {
    setSelectedSlug(mat.slug);
    setSelectedName(mat.name);
    setQuery(mat.name);
    setSuggestions([]);
  };

  const handleVisualize = async (slug = selectedSlug, room = selectedRoom) => {
    if (!slug) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_slug: slug, room }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to visualize.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVisualize();
  };

  return (
    <>
      {/* Hero */}
      <div
        style={{
          padding: "calc(var(--header-height) + clamp(4rem, 7vw, 7rem)) var(--gutter) clamp(3rem, 5vw, 5rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <Link href="/materials">Materials</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <span className="breadcrumb-current">Room visualizer</span>
        </nav>

        <h1
          style={{
            margin: "1.5rem 0 0",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3rem, 6vw, 6rem)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            maxWidth: "14ch",
          }}
        >
          See it in your space.
        </h1>
        <p style={{ margin: "1.5rem 0 0", color: "var(--color-stone-dark)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "38rem" }}>
          Search for any slab in our library, choose a room type, and preview how the stone would look installed.
        </p>
      </div>

      {/* Controls */}
      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-paper)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ maxWidth: "42rem" }}>
          {/* Material search */}
          <div className="finder-field" style={{ marginBottom: "1.25rem", position: "relative" }}>
            <label>Stone material</label>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a slab — e.g., Calacatta, Blue Bahia…"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
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
                      <div style={{ width: "2.5rem", height: "2.5rem", position: "relative", borderRadius: "2px", overflow: "hidden", flexShrink: 0 }}>
                        <Image src={mat.image_urls[0]} alt={mat.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink)", fontWeight: 500 }}>{mat.name}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-stone-dark)" }}>{mat.material_type} · {mat.finish}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room selector */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem", color: "var(--color-stone-dark)" }}>
              Room
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {ROOMS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRoom(value)}
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: selectedRoom === value ? "var(--color-ink)" : "var(--color-line)",
                    background: selectedRoom === value ? "var(--color-ink)" : "transparent",
                    color: selectedRoom === value ? "var(--color-white)" : "var(--color-ink)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="button button-ink"
            disabled={!selectedSlug || loading}
          >
            {loading ? "Generating…" : "Visualize"}
          </button>
        </form>
      </section>

      {/* Result */}
      {(result || loading || error) && (
        <section
          style={{
            padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
            background: "var(--color-white)",
          }}
        >
          {error && (
            <p style={{ color: "var(--color-error)", fontSize: "0.88rem" }}>{error}</p>
          )}

          {loading && (
            <div style={{ maxWidth: "42rem" }}>
              <div className="skeleton" style={{ height: "24rem", borderRadius: "var(--radius-card)" }} />
            </div>
          )}

          {result && !loading && (
            <div style={{ maxWidth: "52rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <span className="eyebrow" style={{ color: "var(--color-bronze-ink)" }}>
                  {result.room_label} · {result.name}
                </span>
              </div>

              {/* Mock visualizer canvas */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingBottom: "62.5%",
                  borderRadius: "var(--radius-card)",
                  overflow: "hidden",
                  border: "1px solid var(--color-line)",
                }}
              >
                {/* Room silhouette background */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(160deg, #e8e0d4 0%, #d4ccc0 100%)`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Stone surface area */}
                  <div
                    style={{
                      height: "35%",
                      background: result.preview.texture_url
                        ? `url(${result.preview.texture_url}) center/cover`
                        : `linear-gradient(135deg, ${result.preview.colors[0]}, ${result.preview.colors[1]}, ${result.preview.colors[2]})`,
                      borderTop: "2px solid rgba(0,0,0,0.08)",
                    }}
                  />
                </div>

                {/* Overlay label */}
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    background: "rgba(23,24,21,0.75)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {result.room_label}
                </div>

                {/* Material thumbnail inset */}
                {result.preview.texture_url && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1rem",
                      right: "1rem",
                      width: "5rem",
                      height: "5rem",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "2px solid rgba(255,255,255,0.8)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Image
                      src={result.preview.texture_url}
                      alt={result.name}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--color-stone-dark)", lineHeight: 1.6 }}>
                {result.note}
              </p>

              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href={`/materials/${result.slug}`} className="button button-ink" style={{ fontSize: "0.85rem" }}>
                  View full slab details
                </Link>
                <Link href={`/compare?slugs=${result.slug}`} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "transparent",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-card)",
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}>
                  Compare
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Callout */}
      {!result && !loading && (
        <section
          style={{
            padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
            background: "var(--color-white)",
          }}
        >
          <div style={{ maxWidth: "38rem" }}>
            <p className="eyebrow" style={{ color: "var(--color-stone-dark)", marginBottom: "1rem" }}>
              How it works
            </p>
            <ol style={{ margin: 0, padding: "0 0 0 1.25rem", lineHeight: 2, color: "var(--color-ink)", fontSize: "0.92rem" }}>
              <li>Search for any slab from our library</li>
              <li>Choose a room type</li>
              <li>See a preview of how the stone looks installed</li>
              <li>Like it? Visit our yard in Northridge for a live look</li>
            </ol>
            <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--color-stone-dark)" }}>
              Full AI room visualization is coming soon — bringing real room photography with the exact stone texture composited in.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
