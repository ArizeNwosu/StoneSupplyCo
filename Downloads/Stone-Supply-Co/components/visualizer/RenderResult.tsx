"use client";

import { useState } from "react";
import Link from "next/link";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { LeadCaptureModal } from "./LeadCaptureModal";
import { StoneThumbnail } from "./StoneThumbnail";
import type { SurfaceSelection } from "@/types/visualizer";
import type { ColorFamily } from "@/types/material";

type Props = {
  photoUrl: string;
  renderUrl: string;
  surfaces: SurfaceSelection[];
  shareToken: string;
  rendersRemaining: number;
  sessionId: string;
  leadCaptured: boolean;
  onLeadCaptured: () => void;
  onTryDifferent: () => void;
};

export function RenderResult({
  photoUrl,
  renderUrl,
  surfaces,
  shareToken,
  rendersRemaining,
  sessionId,
  leadCaptured,
  onLeadCaptured,
  onTryDifferent,
}: Props) {
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/visualizer/shared/${shareToken}`
      : "";

  const handleGatedAction = (action: string) => {
    if (leadCaptured) {
      executeAction(action);
    } else {
      setModalAction(action);
    }
  };

  const executeAction = (action: string) => {
    if (action === "download") {
      const a = document.createElement("a");
      a.href = renderUrl;
      a.download = "stone-visualization.png";
      a.click();
    }
    // quote and visit just confirm — the lead was already captured
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
    }
  };

  const surfaceLabel = surfaces
    .map((s) => s.material_name)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  return (
    <div style={{ maxWidth: "52rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <span className="eyebrow" style={{ color: "var(--color-bronze-ink)" }}>
          {surfaceLabel}
        </span>
      </div>

      <BeforeAfterSlider
        beforeSrc={photoUrl}
        afterSrc={renderUrl}
        alt={`Stone visualization — ${surfaceLabel}`}
      />

      <div className="visualizer-result-stones" aria-label="Stones used">
        {surfaces.map((surface) => (
          <div className="visualizer-result-stone" key={surface.surface}>
            <StoneThumbnail
              name={surface.material_name}
              slug={surface.material_slug}
              imageUrl={surface.material_image_url}
              colorFamily={surface.material_color_family as ColorFamily | null | undefined}
              size="large"
            />
            <span>
              <small>{surface.surface.replace(/_/g, " ")}</small>
              <strong>{surface.material_name}</strong>
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "0.78rem",
          color: "var(--color-stone-dark)",
        }}
      >
        {rendersRemaining > 0
          ? `${rendersRemaining} visualization${rendersRemaining === 1 ? "" : "s"} remaining`
          : "You've used all your free visualizations."}
      </p>

      {/* Action buttons */}
      <div
        style={{
          marginTop: "1.25rem",
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        {rendersRemaining > 0 && (
          <button
            type="button"
            onClick={onTryDifferent}
            className="button button-ink"
            style={{ fontSize: "0.85rem" }}
          >
            Try a different stone
          </button>
        )}

        <button
          type="button"
          onClick={() => handleGatedAction("download")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Download
        </button>

        <button
          type="button"
          onClick={handleShare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          {copied ? "Link copied!" : "Share"}
        </button>

        <button
          type="button"
          onClick={() => handleGatedAction("quote")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Request a quote
        </button>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleGatedAction("visit");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          Book a yard visit
        </Link>
      </div>

      {/* Lead capture modal */}
      {modalAction && (
        <LeadCaptureModal
          sessionId={sessionId}
          action={modalAction}
          onCaptured={() => {
            setModalAction(null);
            onLeadCaptured();
            executeAction(modalAction);
          }}
          onClose={() => setModalAction(null)}
        />
      )}
    </div>
  );
}
