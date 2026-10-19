"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  topSlugNames: string[];
};

export function FinderLeadCapture({ topSlugNames }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: "stone-finder",
          notes: topSlugNames.length
            ? `Stone Finder results: ${topSlugNames.join(", ")}`
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }

      setSubmitted(true);
      trackEvent("stone_finder_complete", { label: topSlugNames[0] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: "2rem",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-card)",
          background: "var(--color-white)",
          marginTop: "3rem",
        }}
      >
        <p
          className="eyebrow"
          style={{ color: "var(--color-success)", marginBottom: "0.75rem" }}
        >
          ✓ Sent
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "1.35rem" }}>
          Your details have been shared with the yard.
        </p>
        <p
          style={{
            margin: "0.75rem 0 0",
            color: "var(--color-stone-dark)",
            fontSize: "0.85rem",
          }}
        >
          Ali will be in touch. In the meantime, visit the yard to see your
          matched slabs in person — they&apos;re best experienced at full scale.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-card)",
        background: "var(--color-white)",
        marginTop: "3rem",
        maxWidth: "38rem",
      }}
    >
      <p className="eyebrow" style={{ color: "var(--color-bronze-ink)", marginBottom: "0.5rem" }}>
        Share your results with the yard
      </p>
      <p
        style={{
          margin: "0 0 1.5rem",
          fontFamily: "var(--font-serif)",
          fontSize: "1.2rem",
          lineHeight: 1.3,
        }}
      >
        Leave your contact and Ali will follow up about your top matches.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="finder-field">
          <label htmlFor="lead-name">Name (optional)</label>
          <input
            id="lead-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="finder-field">
          <label htmlFor="lead-email">Email *</label>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="finder-field">
          <label htmlFor="lead-phone">Phone (optional)</label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(818) 555-0100"
          />
        </div>

        {error && (
          <p style={{ margin: 0, color: "var(--color-error)", fontSize: "0.82rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="button button-ink"
          disabled={loading}
          style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
        >
          {loading ? "Sending…" : "Send my results"}
        </button>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--color-stone-dark)", lineHeight: 1.5 }}>
          By submitting you agree that Stone Supply Co. may use your contact
          information to respond to this inquiry. We don&apos;t sell your data.{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>.
        </p>
      </form>
    </div>
  );
}
