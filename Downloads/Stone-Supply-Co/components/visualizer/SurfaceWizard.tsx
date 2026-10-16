"use client";

import { useState } from "react";
import Image from "next/image";
import { ROOM_SURFACES } from "@/types/visualizer";
import type { RoomType, SurfaceSelection, SurfaceOption } from "@/types/visualizer";
import type { MaterialSummary } from "@/types/material";
import { StoneSearch } from "./StoneSearch";

type Props = {
  roomType: RoomType;
  onComplete: (selections: SurfaceSelection[]) => void;
  onBack: () => void;
};

type SurfaceStep = {
  option: SurfaceOption;
  action: "apply" | "skip" | null;
  material: MaterialSummary | null;
  waterfall: boolean;
};

export function SurfaceWizard({ roomType, onComplete, onBack }: Props) {
  const surfaceOptions = ROOM_SURFACES[roomType];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [steps, setSteps] = useState<SurfaceStep[]>(
    surfaceOptions.map((opt) => ({
      option: opt,
      action: null,
      material: null,
      waterfall: false,
    }))
  );
  const [reviewing, setReviewing] = useState(false);

  const current = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;

  const updateStep = (patch: Partial<SurfaceStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, ...patch } : s))
    );
  };

  const goNext = () => {
    if (isLast) {
      setReviewing(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (reviewing) {
      setReviewing(false);
      setCurrentIndex(steps.length - 1);
    } else if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    const selections: SurfaceSelection[] = steps
      .filter((s) => s.action === "apply" && s.material)
      .map((s) => ({
        surface: s.option.value,
        material_slug: s.material!.slug,
        material_name: s.material!.name,
        waterfall: s.option.value === "island" ? s.waterfall : undefined,
      }));
    onComplete(selections);
  };

  const appliedCount = steps.filter(
    (s) => s.action === "apply" && s.material
  ).length;

  // ── Review screen ─────────────────────────────────────
  if (reviewing) {
    const applied = steps.filter((s) => s.action === "apply" && s.material);
    return (
      <div>
        <p className="eyebrow" style={{ color: "var(--color-stone-dark)", marginBottom: "0.75rem" }}>
          Review your selections
        </p>

        {applied.length === 0 ? (
          <p style={{ color: "var(--color-error)", fontSize: "0.88rem" }}>
            No surfaces selected. Go back and pick at least one stone.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {applied.map((s) => (
              <div
                key={s.option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "var(--color-white)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-card)",
                }}
              >
                {s.material!.image_urls?.[0] && (
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      position: "relative",
                      borderRadius: "2px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={s.material!.image_urls[0]}
                      alt={s.material!.name}
                      fill
                      sizes="48px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--color-ink)" }}>
                    {s.option.label}
                    {s.waterfall ? " (waterfall)" : ""}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-stone-dark)" }}>
                    {s.material!.name} · {s.material!.material_type} · {s.material!.finish}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              padding: "0.55rem 1.1rem",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-card)",
              background: "transparent",
              color: "var(--color-ink)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            className="button button-ink"
            disabled={appliedCount === 0}
            onClick={handleSubmit}
          >
            Visualize
          </button>
        </div>
      </div>
    );
  }

  // ── Surface step ──────────────────────────────────────
  return (
    <div>
      <p className="eyebrow" style={{ color: "var(--color-stone-dark)", marginBottom: "0.5rem" }}>
        Surface {currentIndex + 1} of {steps.length}
      </p>
      <h3
        style={{
          margin: "0 0 1rem",
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 400,
        }}
      >
        {current.option.label}
      </h3>

      {/* Apply / Skip toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {(["apply", "skip"] as const).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => updateStep({ action })}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: "1px solid",
              borderColor: current.action === action ? "var(--color-ink)" : "var(--color-line)",
              background: current.action === action ? "var(--color-ink)" : "transparent",
              color: current.action === action ? "var(--color-white)" : "var(--color-ink)",
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {action === "apply" ? "Apply stone" : "Skip"}
          </button>
        ))}
      </div>

      {/* Stone search — only when applying */}
      {current.action === "apply" && (
        <div style={{ marginBottom: "1.25rem" }}>
          <StoneSearch
            label={`Choose stone for ${current.option.label.toLowerCase()}`}
            selected={current.material}
            onSelect={(mat) => updateStep({ material: mat })}
          />

          {/* Waterfall toggle for island */}
          {current.option.value === "island" && current.material && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.75rem",
                fontSize: "0.88rem",
                color: "var(--color-ink)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={current.waterfall}
                onChange={(e) => updateStep({ waterfall: e.target.checked })}
              />
              Waterfall edges (stone continues down the sides)
            </label>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={goBack}
          style={{
            padding: "0.55rem 1.1rem",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            background: "transparent",
            color: "var(--color-ink)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          className="button button-ink"
          disabled={current.action === "apply" && !current.material}
          onClick={goNext}
        >
          {current.action === null
            ? "Choose an option above"
            : isLast
              ? "Review selections"
              : "Next surface →"}
        </button>
      </div>
    </div>
  );
}
