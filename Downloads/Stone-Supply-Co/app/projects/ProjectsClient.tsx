"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  getSavedSlugs,
  type SavedProject,
} from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";

export function ProjectsClient() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProjects(getProjects());
    setSavedCount(getSavedSlugs().length);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const project = createProject(newName.trim() || "My project");
    setProjects((prev) => [...prev, project]);
    setNewName("");
    setCreating(false);
  };

  const handleDeleted = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
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
          <span className="breadcrumb-current">Saved projects</span>
        </nav>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.5rem, 5vw, 5rem)",
                fontWeight: 400,
                letterSpacing: "-0.045em",
                lineHeight: 0.95,
              }}
            >
              Your projects
            </h1>
            {mounted && (
              <p style={{ margin: "1rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.9rem" }}>
                {projects.length === 0 ? "No projects yet" : `${projects.length} project${projects.length > 1 ? "s" : ""}`}
                {savedCount > 0 && ` · ${savedCount} individually saved material${savedCount > 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          <button
            onClick={() => setCreating(true)}
            className="button button-ink"
            style={{ marginBottom: "0.25rem" }}
          >
            + New project
          </button>
        </div>
      </div>

      {/* New project form */}
      {creating && (
        <div
          style={{
            padding: "1.5rem var(--gutter)",
            background: "var(--color-paper)",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem", maxWidth: "32rem" }}>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              style={{
                flex: 1,
                padding: "0.6rem 0.9rem",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-card)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                background: "var(--color-white)",
                color: "var(--color-ink)",
              }}
            />
            <button type="submit" className="button button-ink">
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-stone-dark)",
                fontSize: "0.85rem",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Projects grid */}
      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
          minHeight: "40vh",
        }}
      >
        {!mounted ? null : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--color-stone-dark)" }}>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.5rem, 2.5vw, 2.5rem)",
                fontWeight: 400,
                letterSpacing: "-0.03em",
                margin: "0 0 1rem",
                color: "var(--color-ink)",
              }}
            >
              Start collecting materials
            </p>
            <p style={{ fontSize: "0.9rem", margin: "0 0 2rem", lineHeight: 1.7 }}>
              Browse the material library and save slabs to a project.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/materials" className="button button-ink">
                Browse materials
              </Link>
              <button
                onClick={() => setCreating(true)}
                className="button button-outline"
                style={{
                  background: "none",
                  border: "1px solid var(--color-ink)",
                  padding: "0.65rem 1.4rem",
                  borderRadius: "var(--radius-card)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  color: "var(--color-ink)",
                }}
              >
                Create project
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))",
              gap: "1.5rem",
            }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </section>

      {/* Saved materials shortcut */}
      {mounted && savedCount > 0 && (
        <section
          style={{
            padding: "clamp(2.5rem, 4vw, 4rem) var(--gutter)",
            background: "var(--color-warm)",
            borderTop: "1px solid var(--color-line)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-stone-dark)" }}>
            You also have{" "}
            <strong style={{ color: "var(--color-ink)" }}>
              {savedCount} individually saved material{savedCount > 1 ? "s" : ""}
            </strong>{" "}
            — not in any project.{" "}
            <Link
              href="/materials?saved=1"
              style={{ color: "var(--color-bronze-ink)", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              View saved
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
