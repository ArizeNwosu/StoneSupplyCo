"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const CUSTOMER_TYPES = [
  "Interior Designer",
  "General Contractor",
  "Kitchen & Bath Remodeler",
  "Stone Fabricator",
  "Architect",
  "Homebuilder",
  "Other Trade",
];

const TIMELINES = [
  "Within 2 weeks",
  "1–2 months",
  "3–6 months",
  "Ongoing projects",
];

type State = "idle" | "loading" | "success" | "error";

export function TradeApplicationForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get("name") as string,
      email: data.get("email") as string,
      phone: data.get("phone") as string | undefined,
      customer_type: data.get("customer_type") as string,
      location: data.get("location") as string | undefined,
      timeline: data.get("timeline") as string | undefined,
      fabricator_status: data.get("fabricator_status") as string | undefined,
      notes: data.get("notes") as string | undefined,
      source: "trade-application" as const,
    };

    if (!payload.name || !payload.email) {
      setError("Name and email are required.");
      return;
    }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Something went wrong.");
      }

      setState("success");
      trackEvent("trade_application");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div
        style={{
          padding: "2.5rem",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-card)",
          background: "var(--color-white)",
          maxWidth: "44rem",
        }}
      >
        <p className="eyebrow" style={{ color: "var(--color-success)", marginBottom: "0.75rem" }}>
          ✓ Application received
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "1.35rem", lineHeight: 1.3 }}>
          We&apos;ll review your application and be in touch to discuss your account.
        </p>
        <p style={{ margin: "1rem 0 0", color: "var(--color-stone-dark)", fontSize: "0.88rem" }}>
          If you need to reach us sooner, call the yard directly. In the meantime, feel free to browse our material library.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))",
        gap: "1rem",
        maxWidth: "44rem",
      }}
    >
      <div className="finder-field">
        <label htmlFor="trade-name">Full name *</label>
        <input id="trade-name" name="name" type="text" required placeholder="Ali Johnson" />
      </div>

      <div className="finder-field">
        <label htmlFor="trade-email">Business email *</label>
        <input id="trade-email" name="email" type="email" required placeholder="you@firm.com" />
      </div>

      <div className="finder-field">
        <label htmlFor="trade-phone">Phone</label>
        <input id="trade-phone" name="phone" type="tel" placeholder="(818) 555-0100" />
      </div>

      <div className="finder-field">
        <label htmlFor="trade-type">Trade category *</label>
        <select id="trade-type" name="customer_type" required>
          <option value="">Select…</option>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="finder-field">
        <label htmlFor="trade-location">City / area you serve</label>
        <input id="trade-location" name="location" type="text" placeholder="Los Angeles, San Fernando Valley…" />
      </div>

      <div className="finder-field">
        <label htmlFor="trade-timeline">Typical project timeline</label>
        <select id="trade-timeline" name="timeline">
          <option value="">Select…</option>
          {TIMELINES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="finder-field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor="trade-fabricator">Do you have a preferred fabricator?</label>
        <input
          id="trade-fabricator"
          name="fabricator_status"
          type="text"
          placeholder="Yes — [name] / No — still looking / We fabricate in-house"
        />
      </div>

      <div className="finder-field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor="trade-notes">Anything else we should know</label>
        <textarea
          id="trade-notes"
          name="notes"
          rows={3}
          placeholder="Current project, material interest, volume expectations…"
          style={{ resize: "vertical" }}
        />
      </div>

      {(state === "error" || error) && (
        <p style={{ gridColumn: "1 / -1", margin: 0, color: "var(--color-error)", fontSize: "0.82rem" }}>
          {error}
        </p>
      )}

      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button type="submit" className="button button-ink" disabled={state === "loading"}>
          {state === "loading" ? "Sending…" : "Submit application"}
        </button>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-stone-dark)", lineHeight: 1.5 }}>
          By submitting you agree that Stone Supply Co. may use your contact
          information to respond to your trade account inquiry. We don&apos;t sell your data.{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>.
        </p>
      </div>
    </form>
  );
}
