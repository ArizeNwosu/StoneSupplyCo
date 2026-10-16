"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/visualizer/BeforeAfterSlider";

type SharedData = {
  photo_url: string;
  room_type: string;
  render_url: string;
  surfaces: {
    surface: string;
    material_name: string;
    material_type: string | null;
    finish: string | null;
    image_url: string | null;
    waterfall: boolean;
  }[];
};

export function SharedVisualizerClient({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/visualize/shared/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Visualization not found.");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <div
        style={{
          padding:
            "calc(var(--header-height) + clamp(3rem, 5vw, 5rem)) var(--gutter) clamp(2rem, 4vw, 4rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Stone Visualization
        </h1>
        <p
          style={{
            margin: "1rem 0 0",
            fontSize: "0.92rem",
            color: "var(--color-stone-dark)",
            lineHeight: 1.6,
          }}
        >
          Shared from Stone Supply Co&rsquo;s AI visualizer.
        </p>
      </div>

      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
        }}
      >
        {loading && (
          <div
            className="skeleton"
            style={{
              height: "24rem",
              maxWidth: "52rem",
              borderRadius: "var(--radius-card)",
            }}
          />
        )}

        {error && (
          <p style={{ color: "var(--color-error)", fontSize: "0.88rem" }}>
            {error}
          </p>
        )}

        {data && (
          <div style={{ maxWidth: "52rem" }}>
            <BeforeAfterSlider
              beforeSrc={data.photo_url}
              afterSrc={data.render_url}
              alt="Shared stone visualization"
            />

            {/* Surface list */}
            <div style={{ marginTop: "1.5rem" }}>
              <p
                className="eyebrow"
                style={{
                  color: "var(--color-stone-dark)",
                  marginBottom: "0.75rem",
                }}
              >
                Stones used
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {data.surfaces.map((s) => (
                  <div
                    key={s.surface}
                    style={{
                      padding: "0.6rem 0.75rem",
                      background: "var(--color-paper)",
                      borderRadius: "var(--radius-card)",
                      fontSize: "0.88rem",
                    }}
                  >
                    <strong style={{ textTransform: "capitalize" }}>
                      {s.surface.replace(/_/g, " ")}
                      {s.waterfall ? " (waterfall)" : ""}:
                    </strong>{" "}
                    {s.material_name}
                    {s.material_type ? ` · ${s.material_type}` : ""}
                    {s.finish ? ` · ${s.finish}` : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Link href="/visualizer" className="button button-ink">
                Try the visualizer yourself
              </Link>
              <Link
                href="/materials"
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
                Browse all materials
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
