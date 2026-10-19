"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, startTransition } from "react";
import {
  getProject,
  updateProject,
  deleteProject,
  removeMaterialFromProject,
  type SavedProject,
} from "@/lib/projects";
import type { MaterialSummary } from "@/types/material";

export function ProjectDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<SavedProject | null>(null);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p) {
      router.replace("/projects");
      return;
    }
    startTransition(() => {
      setMounted(true);
      setProject(p);
      setNameValue(p.name);
    });

    // Fetch material summaries
    if (p.materialSlugs.length > 0) {
      Promise.all(
        p.materialSlugs.map((slug) =>
          fetch(`/api/materials/${slug}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data?.material as MaterialSummary | null)
            .catch(() => null)
        )
      ).then((results) => {
        setMaterials(results.filter(Boolean) as MaterialSummary[]);
      });
    }
  }, [id, router]);

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateProject(id, { name: nameValue.trim() || project!.name });
    if (updated) setProject(updated);
    setEditingName(false);
  };

  const handleRemoveMaterial = (slug: string) => {
    const updated = removeMaterialFromProject(id, slug);
    if (updated) {
      setProject(updated);
      setMaterials((prev) => prev.filter((m) => m.slug !== slug));
    }
  };

  const handleDeleteProject = () => {
    if (confirm("Delete this project? This cannot be undone.")) {
      deleteProject(id);
      router.push("/projects");
    }
  };

  if (!mounted) return null;
  if (!project) return null;

  return (
    <>
      {/* Hero */}
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
          <Link href="/projects">Projects</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <span className="breadcrumb-current">{project.name}</span>
        </nav>

        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            {editingName ? (
              <form onSubmit={handleRename} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(2rem, 4vw, 4rem)",
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    border: "none",
                    borderBottom: "2px solid var(--color-ink)",
                    background: "transparent",
                    color: "var(--color-ink)",
                    outline: "none",
                    width: "20ch",
                  }}
                />
                <button type="submit" className="button button-ink" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Save</button>
                <button type="button" onClick={() => setEditingName(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "var(--color-stone-dark)" }}>Cancel</button>
              </form>
            ) : (
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2.5rem, 5vw, 5rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.045em",
                  lineHeight: 0.95,
                  cursor: "pointer",
                }}
                onClick={() => setEditingName(true)}
                title="Click to rename"
              >
                {project.name}
              </h1>
            )}
            <p style={{ margin: "1rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.82rem" }}>
              {project.materialSlugs.length} material{project.materialSlugs.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href={`/compare?slugs=${project.materialSlugs.slice(0, 3).join(",")}`}
              className="button button-outline"
              style={{
                background: "none",
                border: "1px solid var(--color-ink)",
                padding: "0.6rem 1.2rem",
                borderRadius: "var(--radius-card)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.82rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--color-ink)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Compare
            </Link>
            <button
              onClick={handleDeleteProject}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.82rem",
                color: "var(--color-stone-dark)",
                padding: "0.6rem 0",
              }}
            >
              Delete project
            </button>
          </div>
        </div>
      </div>

      {/* Materials list */}
      <section style={{ padding: "clamp(3rem, 5vw, 5rem) var(--gutter)", background: "var(--color-white)", minHeight: "40vh" }}>
        {project.materialSlugs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--color-stone-dark)" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 1rem", color: "var(--color-ink)" }}>
              No materials yet
            </p>
            <p style={{ fontSize: "0.88rem", margin: "0 0 2rem" }}>
              Browse the material library and save slabs to this project.
            </p>
            <Link href="/materials" className="button button-ink">
              Browse materials
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
            {project.materialSlugs.map((slug, i) => {
              const mat = materials.find((m) => m.slug === slug);
              return (
                <div
                  key={slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1rem 1.25rem",
                    background: "var(--color-white)",
                    borderBottom: i < project.materialSlugs.length - 1 ? "1px solid var(--color-line)" : "none",
                  }}
                >
                  <div style={{ width: "3.5rem", height: "3.5rem", background: "var(--color-warm)", borderRadius: "2px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    {mat?.image_urls?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mat.image_urls[0]} alt={mat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/materials/${slug}`}
                      style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)", textDecoration: "none", letterSpacing: "-0.01em" }}
                    >
                      {mat?.name ?? slug}
                    </Link>
                    {mat && (
                      <p style={{ margin: "0.2rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.78rem" }}>
                        {mat.material_type} · {mat.finish}
                        {mat.price && ` · $${mat.price.toLocaleString()}/sf`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveMaterial(slug)}
                    aria-label="Remove from project"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-stone-dark)", fontSize: "1.2rem", lineHeight: 1, padding: "0.25rem", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {project.materialSlugs.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <Link href="/materials" style={{ color: "var(--color-bronze-ink)", fontSize: "0.88rem", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              + Add more materials
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
