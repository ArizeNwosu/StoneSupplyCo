"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Material } from "@/types/material";

const MAX_COMPARE = 3;

const SPEC_ROWS: { key: keyof Material; label: string }[] = [
  { key: "material_type", label: "Type" },
  { key: "finish", label: "Finish" },
  { key: "color_family", label: "Color family" },
  { key: "origin", label: "Origin" },
  { key: "thickness", label: "Thickness" },
  { key: "dimensions", label: "Slab dimensions" },
  { key: "availability", label: "Availability" },
];

function AvailDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "var(--color-success)",
    low: "#b8790a",
    unavailable: "var(--color-error)",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] ?? "#aaa", display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CellValue({ val, field }: { val: unknown; field: string }) {
  if (val === null || val === undefined || val === "") return <span style={{ color: "var(--color-stone-dark)", opacity: 0.4 }}>—</span>;
  if (field === "availability") return <AvailDot status={String(val)} />;
  if (Array.isArray(val)) return <>{val.join(", ")}</>;
  return <>{String(val)}</>;
}

export function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [materials, setMaterials] = useState<(Material | null)[]>([]);
  const [loading, setLoading] = useState(true);

  const slugsParam = searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  useEffect(() => {
    if (slugs.length === 0) {
      startTransition(() => { setLoading(false); });
      return;
    }
    startTransition(() => { setLoading(true); });
    Promise.all(
      slugs.map((slug) =>
        fetch(`/api/materials/${slug}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.material as Material) ?? null)
          .catch(() => null)
      )
    ).then((results) => {
      setMaterials(results);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsParam]);

  const removeSlug = (slug: string) => {
    const next = slugs.filter((s) => s !== slug);
    if (next.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?slugs=${next.join(",")}`);
    }
  };

  const loaded = materials.filter(Boolean) as Material[];

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "calc(var(--header-height) + clamp(3rem, 5vw, 5rem)) var(--gutter) clamp(2rem, 4vw, 4rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <Link href="/materials">Materials</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <span className="breadcrumb-current">Compare</span>
        </nav>
        <h1
          style={{
            margin: "1.5rem 0 0",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.5rem, 5vw, 5rem)",
            fontWeight: 400,
            letterSpacing: "-0.045em",
            lineHeight: 0.95,
          }}
        >
          Side-by-side
        </h1>
        <p style={{ margin: "1rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.9rem" }}>
          Compare up to {MAX_COMPARE} materials at once.
        </p>
      </div>

      {/* Compare table */}
      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
          overflowX: "auto",
        }}
      >
        {slugs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 1rem" }}>
              No materials selected
            </p>
            <p style={{ color: "var(--color-stone-dark)", fontSize: "0.88rem", margin: "0 0 2rem" }}>
              Browse the library and use the Compare button on any slab.
            </p>
            <Link href="/materials" className="button button-ink">
              Browse materials
            </Link>
          </div>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${slugs.length + 1}, 1fr)`, gap: "1px", minWidth: "36rem" }}>
            {[...Array(slugs.length)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "20rem", borderRadius: "var(--radius-card)" }} />
            ))}
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              minWidth: `${Math.max(36, loaded.length * 14)}rem`,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            {/* Image row */}
            <thead>
              <tr>
                <th style={{ width: "10rem", background: "transparent" }} />
                {loaded.map((mat) => (
                  <th key={mat.slug} style={{ padding: "0 0.75rem 1.5rem", textAlign: "left", fontWeight: 400, verticalAlign: "top" }}>
                    <div style={{ position: "relative", width: "100%", paddingBottom: "75%", background: "var(--color-warm)", borderRadius: "var(--radius-card)", overflow: "hidden", marginBottom: "0.75rem" }}>
                      {mat.image_urls?.[0] && (
                        <Image
                          src={mat.image_urls[0]}
                          alt={mat.name}
                          fill
                          sizes="300px"
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <Link
                          href={`/materials/${mat.slug}`}
                          style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)", textDecoration: "none", letterSpacing: "-0.01em" }}
                        >
                          {mat.name}
                        </Link>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--color-stone-dark)" }}>
                          {mat.material_type}
                        </p>
                      </div>
                      <button
                        onClick={() => removeSlug(mat.slug)}
                        aria-label={`Remove ${mat.name}`}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-stone-dark)", fontSize: "1.1rem", lineHeight: 1, padding: "0.2rem", flexShrink: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                {/* Placeholder column for adding more */}
                {loaded.length < MAX_COMPARE && (
                  <th style={{ padding: "0 0.75rem 1.5rem", textAlign: "left", verticalAlign: "top" }}>
                    <Link
                      href="/materials"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "9rem",
                        border: "1px dashed var(--color-line)",
                        borderRadius: "var(--radius-card)",
                        color: "var(--color-stone-dark)",
                        textDecoration: "none",
                        fontSize: "0.82rem",
                        marginBottom: "0.75rem",
                        transition: "border-color 0.15s",
                      }}
                    >
                      + Add slab
                    </Link>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {/* Price row */}
              <tr style={{ borderTop: "1px solid var(--color-line)" }}>
                <td style={{ padding: "1rem 1rem 1rem 0", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-stone-dark)", verticalAlign: "top" }}>
                  Price
                </td>
                {loaded.map((mat) => (
                  <td key={mat.slug} style={{ padding: "1rem 0.75rem", verticalAlign: "top" }}>
                    {mat.clearance_price ? (
                      <span>
                        <span style={{ fontWeight: 600 }}>${mat.clearance_price.toLocaleString()}</span>
                        <span style={{ color: "var(--color-stone-dark)", fontSize: "0.78rem" }}>/sf </span>
                        <span style={{ textDecoration: "line-through", color: "var(--color-stone-dark)", fontSize: "0.78rem" }}>${mat.price?.toLocaleString()}</span>
                      </span>
                    ) : mat.price ? (
                      <span>
                        <span style={{ fontWeight: 600 }}>${mat.price.toLocaleString()}</span>
                        <span style={{ color: "var(--color-stone-dark)", fontSize: "0.78rem" }}>/sf</span>
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-stone-dark)", opacity: 0.4 }}>—</span>
                    )}
                  </td>
                ))}
                {loaded.length < MAX_COMPARE && <td />}
              </tr>

              {/* Spec rows */}
              {SPEC_ROWS.map(({ key, label }) => (
                <tr key={key} style={{ borderTop: "1px solid var(--color-line)" }}>
                  <td style={{ padding: "1rem 1rem 1rem 0", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-stone-dark)", verticalAlign: "top" }}>
                    {label}
                  </td>
                  {loaded.map((mat) => (
                    <td key={mat.slug} style={{ padding: "1rem 0.75rem", verticalAlign: "top", fontSize: "0.88rem" }}>
                      <CellValue val={mat[key]} field={key} />
                    </td>
                  ))}
                  {loaded.length < MAX_COMPARE && <td />}
                </tr>
              ))}

              {/* Applications row */}
              <tr style={{ borderTop: "1px solid var(--color-line)" }}>
                <td style={{ padding: "1rem 1rem 1rem 0", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-stone-dark)", verticalAlign: "top" }}>
                  Applications
                </td>
                {loaded.map((mat) => (
                  <td key={mat.slug} style={{ padding: "1rem 0.75rem", verticalAlign: "top", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {mat.applications?.length ? mat.applications.join(", ") : <span style={{ color: "var(--color-stone-dark)", opacity: 0.4 }}>—</span>}
                  </td>
                ))}
                {loaded.length < MAX_COMPARE && <td />}
              </tr>

              {/* CTA row */}
              <tr style={{ borderTop: "1px solid var(--color-line)" }}>
                <td style={{ padding: "1.5rem 1rem 0.5rem 0" }} />
                {loaded.map((mat) => (
                  <td key={mat.slug} style={{ padding: "1.5rem 0.75rem 0.5rem" }}>
                    <Link href={`/materials/${mat.slug}`} className="button button-ink" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", display: "inline-block" }}>
                      View slab
                    </Link>
                  </td>
                ))}
                {loaded.length < MAX_COMPARE && <td />}
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
