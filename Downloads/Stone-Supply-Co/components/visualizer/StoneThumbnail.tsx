"use client";

import { useState } from "react";
import type { ColorFamily } from "@/types/material";

type Props = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  colorFamily?: ColorFamily | null;
  size?: "small" | "large";
};

const COLOR_TONES: Record<ColorFamily, [string, string, string]> = {
  White: ["#f3f0e8", "#cbc7bd", "#faf8f3"],
  Cream: ["#e8dcc5", "#bda98b", "#f5ead4"],
  Grey: ["#c7c7c3", "#858883", "#e1dfda"],
  Black: ["#383a38", "#77766f", "#171816"],
  Brown: ["#9b775e", "#5e4334", "#c8aa8c"],
  Green: ["#708170", "#324d41", "#b1b8a1"],
  Blue: ["#778d96", "#3e5865", "#c1ccd0"],
  Multi: ["#c2ab91", "#667b77", "#e2d7c8"],
};

function hashAngle(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0) % 180;
}

export function StoneThumbnail({ name, slug, imageUrl, colorFamily = "Grey", size = "small" }: Props) {
  const [failed, setFailed] = useState(false);
  const [base, vein, highlight] = COLOR_TONES[colorFamily ?? "Grey"];
  const angle = hashAngle(slug);

  return (
    <div
      className={`stone-thumbnail stone-thumbnail--${size}`}
      style={{
        backgroundColor: base,
        backgroundImage: `linear-gradient(${angle}deg, transparent 28%, ${vein} 30%, transparent 33%), linear-gradient(${angle + 37}deg, ${highlight} 0 18%, transparent 20% 68%, ${vein} 70%, transparent 72%)`,
      }}
      aria-hidden="true"
    >
      {imageUrl && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" onError={() => setFailed(true)} />
      )}
      {(!imageUrl || failed) && <span>{name.slice(0, 1)}</span>}
    </div>
  );
}
