"use client";

import { useState, useRef, useCallback } from "react";
import { MAX_PHOTO_SIZE_BYTES, MAX_PHOTO_WIDTH } from "@/types/visualizer";

type Props = {
  onUpload: (dataUrl: string) => void;
  disabled?: boolean;
};

export function PhotoUpload({ onUpload, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError("");
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, or HEIC).");
        return;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setError("Photo exceeds 10MB. Please choose a smaller file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, MAX_PHOTO_WIDTH / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onUpload(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "var(--color-ink)" : "var(--color-line)"}`,
          borderRadius: "var(--radius-card)",
          padding: "3rem 1.5rem",
          textAlign: "center",
          cursor: disabled ? "default" : "pointer",
          background: dragOver ? "var(--color-warm)" : "var(--color-white)",
          transition: "all 0.15s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <p style={{ margin: 0, fontSize: "1rem", color: "var(--color-ink)", fontWeight: 500 }}>
          Drop your photo here, or click to browse
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--color-stone-dark)" }}>
          JPEG, PNG, or HEIC · Max 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
          style={{ display: "none" }}
        />
      </div>
      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
