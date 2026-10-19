// app/visualizer/VisualizerClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PhotoUpload } from "@/components/visualizer/PhotoUpload";
import { RoomPicker } from "@/components/visualizer/RoomPicker";
import { SurfaceWizard } from "@/components/visualizer/SurfaceWizard";
import { RenderResult } from "@/components/visualizer/RenderResult";
import type { RoomType, SurfaceSelection } from "@/types/visualizer";
import { MAX_RENDERS_SELF_SERVE } from "@/types/visualizer";

type WizardStep = "upload" | "room" | "surfaces" | "rendering" | "result";

export function VisualizerClient() {
  const contentRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<WizardStep>("upload");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [rendersRemaining, setRendersRemaining] = useState(MAX_RENDERS_SELF_SERVE);
  const [surfaces, setSurfaces] = useState<SurfaceSelection[]>([]);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // ── Upload photo + select room, then create session ──
  const handlePhotoUpload = (dataUrl: string) => {
    setPhotoDataUrl(dataUrl);
    setStep("room");
  };

  const handleRoomSelect = async (room: RoomType) => {
    setRoomType(room);
    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/visualize/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_data: photoDataUrl, room_type: room }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setSessionId(data.session_id);
      setPhotoUrl(data.photo_url);
      setStep("surfaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──
  const handleSurfacesComplete = async (selections: SurfaceSelection[]) => {
    setSurfaces(selections);
    setStep("rendering");
    setError("");

    try {
      const res = await fetch("/api/visualize/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, surfaces: selections }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.limit_reached) {
          setError(data.error);
          setRendersRemaining(0);
          setStep("result");
          return;
        }
        throw new Error(data.error ?? "Render failed.");
      }
      setRenderUrl(data.render_url);
      setShareToken(data.share_token);
      setRendersRemaining(data.renders_remaining);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed.");
      setStep("surfaces");
    }
  };

  // ── Try different stone ──
  const handleTryDifferent = () => {
    setRenderUrl(null);
    setShareToken(null);
    setStep("surfaces");
  };

  // ── Step bar ──
  const STEPS: WizardStep[] = ["upload", "room", "surfaces", "rendering", "result"];
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (step === "upload") return;
    const frame = window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  return (
    <>
      {/* Hero */}
      <div
        style={{
          padding:
            "calc(var(--header-height) + clamp(4rem, 7vw, 7rem)) var(--gutter) clamp(3rem, 5vw, 5rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden>
            ›
          </span>
          <Link href="/materials">Materials</Link>
          <span className="breadcrumb-sep" aria-hidden>
            ›
          </span>
          <span className="breadcrumb-current">Stone Visualizer</span>
        </nav>

        <h1
          style={{
            margin: "1.5rem 0 0",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3rem, 6vw, 6rem)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            maxWidth: "14ch",
          }}
        >
          See it in your space.
        </h1>
        <p
          style={{
            margin: "1.5rem 0 0",
            color: "var(--color-stone-dark)",
            fontSize: "1rem",
            lineHeight: 1.7,
            maxWidth: "38rem",
          }}
        >
          Upload a photo of your kitchen or bathroom, pick your stone for each
          surface, and our AI will show you exactly how it looks — photorealistic,
          in seconds.
        </p>
      </div>

      {/* Step progress bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "0.75rem var(--gutter)",
          background: "var(--color-paper)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        {["Upload", "Room", "Surfaces", "Rendering", "Result"].map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: i <= stepIndex ? "var(--color-ink)" : "var(--color-line)",
              transition: "background 0.3s",
            }}
            title={label}
          />
        ))}
      </div>

      {/* Content */}
      <section
        ref={contentRef}
        className="visualizer-content visualizer-anchor"
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
          minHeight: "50vh",
        }}
      >
        <div style={{ maxWidth: "52rem" }}>
          {error && step !== "result" && (
            <p
              style={{
                color: "var(--color-error)",
                fontSize: "0.88rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Step: Upload */}
          {step === "upload" && (
            <div>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 400,
                }}
              >
                Upload your photo
              </h2>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                }}
              >
                Take a photo of your kitchen or bathroom. For best results, shoot
                straight on so the countertops and surfaces are clearly visible.
              </p>
              <PhotoUpload onUpload={handlePhotoUpload} />
            </div>
          )}

          {/* Step: Room */}
          {step === "room" && (
            <div>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 400,
                }}
              >
                What room is this?
              </h2>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                }}
              >
                This helps us identify the right surfaces to visualize.
              </p>

              {/* Photo preview */}
              {photoDataUrl && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                    border: "1px solid var(--color-line)",
                    maxWidth: "24rem",
                  }}
                >
                  <Image
                    src={photoDataUrl}
                    alt="Your uploaded photo"
                    width={400}
                    height={300}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    unoptimized
                  />
                </div>
              )}

              <RoomPicker value={roomType} onChange={handleRoomSelect} />

              {uploading && (
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.82rem",
                    color: "var(--color-stone-dark)",
                  }}
                >
                  Uploading photo…
                </p>
              )}
            </div>
          )}

          {/* Step: Surfaces */}
          {step === "surfaces" && roomType && (
            <SurfaceWizard
              roomType={roomType}
              onComplete={handleSurfacesComplete}
              onBack={() => setStep("room")}
            />
          )}

          {/* Step: Rendering */}
          {step === "rendering" && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div
                className="skeleton"
                style={{
                  height: "24rem",
                  borderRadius: "var(--radius-card)",
                  maxWidth: "40rem",
                  margin: "0 auto 1.5rem",
                }}
              />
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-ink)",
                  fontWeight: 500,
                }}
              >
                Generating your visualization…
              </p>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-stone-dark)",
                  marginTop: "0.5rem",
                }}
              >
                This usually takes 10–20 seconds. Our AI is compositing your
                stone selections into the photo.
              </p>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && renderUrl && photoUrl && shareToken && sessionId && (
            <RenderResult
              photoUrl={photoUrl}
              renderUrl={renderUrl}
              surfaces={surfaces}
              shareToken={shareToken}
              rendersRemaining={rendersRemaining}
              sessionId={sessionId}
              leadCaptured={leadCaptured}
              onLeadCaptured={() => setLeadCaptured(true)}
              onTryDifferent={handleTryDifferent}
            />
          )}

          {/* Limit reached message */}
          {step === "result" && rendersRemaining <= 0 && !renderUrl && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  margin: "0 0 1rem",
                }}
              >
                You&rsquo;ve used all your free visualizations
              </h2>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                  maxWidth: "32rem",
                  margin: "0 auto",
                }}
              >
                A Stone Supply Co representative will reach out to help you
                explore more options. Visit us at our Northridge yard to see
                these stones in person.
              </p>
              <Link
                href="/materials"
                className="button button-ink"
                style={{ marginTop: "1.5rem", display: "inline-flex" }}
              >
                Browse all materials
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
