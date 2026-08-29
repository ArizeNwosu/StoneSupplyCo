"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { SavedProject } from "@/lib/projects";
import { deleteProject } from "@/lib/projects";

type Props = {
  project: SavedProject;
  onDeleted: (id: string) => void;
};

export function ProjectCard({ project, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (confirming) {
      deleteProject(project.id);
      onDeleted(project.id);
    } else {
      setConfirming(true);
    }
  };

  const count = project.materialSlugs.length;
  const preview = project.materialSlugs.slice(0, 4);

  return (
    <article
      style={{
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-card)",
        background: "var(--color-white)",
        overflow: "hidden",
      }}
    >
      {/* Thumbnail strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(preview.length || 1, 4)}, 1fr)`,
          height: "7rem",
          background: "var(--color-warm)",
        }}
      >
        {preview.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-stone-dark)",
              fontSize: "0.8rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            No materials yet
          </div>
        ) : (
          preview.map((slug) => (
            <div key={slug} style={{ position: "relative", background: "var(--color-warm)" }}>
              <Image
                src={`/api/materials/${slug}/thumb`}
                alt={slug}
                fill
                sizes="120px"
                style={{ objectFit: "cover" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
        <Link
          href={`/projects/${project.id}`}
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.2rem",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            textDecoration: "none",
          }}
        >
          {project.name}
        </Link>

        <p style={{ margin: "0.35rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.82rem" }}>
          {count === 0
            ? "No materials saved"
            : count === 1
            ? "1 material"
            : `${count} materials`}
          {project.notes && ` · ${project.notes.slice(0, 60)}${project.notes.length > 60 ? "…" : ""}`}
        </p>

        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href={`/projects/${project.id}`}
            className="button button-ink"
            style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}
          >
            Open
          </Link>
          <button
            onClick={handleDelete}
            onBlur={() => setConfirming(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              color: confirming ? "var(--color-error)" : "var(--color-stone-dark)",
              padding: "0.45rem 0",
              transition: "color 0.15s",
            }}
          >
            {confirming ? "Delete?" : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
