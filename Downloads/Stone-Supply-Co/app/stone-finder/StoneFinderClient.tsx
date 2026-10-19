"use client";

import { useState } from "react";
import { FinderForm } from "@/components/finder/FinderForm";
import { FinderResults } from "@/components/finder/FinderResults";
import { FinderLeadCapture } from "@/components/finder/FinderLeadCapture";
import type { FinderInput } from "@/lib/gemini";
import type { MaterialSummary } from "@/types/material";
import { trackEvent } from "@/lib/analytics";

type FinderState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      results: MaterialSummary[];
      explanations: Record<string, string>;
    }
  | { status: "error"; message: string };

export function StoneFinderClient() {
  const [state, setState] = useState<FinderState>({ status: "idle" });

  const handleSubmit = async (input: FinderInput) => {
    setState({ status: "loading" });
    trackEvent("stone_finder_start");

    try {
      const res = await fetch("/api/stone-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? "Could not reach the stone finder. Please try again."
        );
      }

      const { results, explanations } = await res.json();
      setState({ status: "done", results, explanations });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  };

  const resultSlugs =
    state.status === "done" ? state.results.map((r) => r.name) : [];

  return (
    <div>
      <FinderForm
        onSubmit={handleSubmit}
        loading={state.status === "loading"}
      />

      {state.status === "loading" && (
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p className="eyebrow" style={{ color: "var(--color-stone-dark)" }}>
            Scanning inventory…
          </p>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "8rem", borderRadius: "var(--radius-card)" }}
            />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.25rem 1.5rem",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-card)",
            background: "rgba(184,50,50,0.05)",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-error)", fontSize: "0.88rem" }}>
            {state.message}
          </p>
        </div>
      )}

      {state.status === "done" && (
        <>
          <FinderResults
            results={state.results}
            explanations={state.explanations}
          />
          <FinderLeadCapture topSlugNames={resultSlugs} />
        </>
      )}
    </div>
  );
}
