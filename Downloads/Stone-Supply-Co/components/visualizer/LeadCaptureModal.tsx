"use client";

import { useState } from "react";

type Props = {
  sessionId: string;
  action: string;
  onCaptured: () => void;
  onClose: () => void;
};

export function LeadCaptureModal({ sessionId, action, onCaptured, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ACTION_LABELS: Record<string, string> = {
    download: "download your visualization",
    quote: "request a quote",
    visit: "book a yard visit",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Please provide your email or phone number.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/visualize/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }

      onCaptured();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--color-white)",
          borderRadius: "var(--radius-card)",
          padding: "2rem",
          maxWidth: "26rem",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            fontWeight: 400,
          }}
        >
          Almost there
        </h3>
        <p
          style={{
            margin: "0 0 1.25rem",
            fontSize: "0.88rem",
            color: "var(--color-stone-dark)",
            lineHeight: 1.6,
          }}
        >
          Enter your contact info to {ACTION_LABELS[action] ?? action}. A Stone
          Supply Co representative may follow up to help with your project.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />
          </div>

          {error && (
            <p style={{ color: "var(--color-error)", fontSize: "0.82rem", margin: "0 0 0.75rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
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
              Cancel
            </button>
            <button
              type="submit"
              className="button button-ink"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
