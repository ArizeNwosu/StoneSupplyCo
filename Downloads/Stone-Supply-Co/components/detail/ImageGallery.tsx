"use client";

import { useState } from "react";
import { FallbackImage } from "@/components/FallbackImage";

type Props = {
  images: string[];
  name: string;
};

export function ImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const cleanImages = images.map((url) => url.replace(/\s+/g, ""));

  if (cleanImages.length === 0) {
    return (
      <div className="detail-gallery">
        <div
          className="detail-gallery-main skeleton"
          aria-label={`${name} — no image available`}
        />
      </div>
    );
  }

  return (
    <div className="detail-gallery">
      <div className="detail-gallery-main">
        <FallbackImage
          src={cleanImages[active]}
          alt={`${name} slab — view ${active + 1}`}
          fill
          priority={active === 0}
          sizes="(max-width: 900px) 100vw, 60vw"
        />
      </div>

      {cleanImages.length > 1 && (
        <div className="detail-gallery-thumbs" role="group" aria-label="Image thumbnails">
          {cleanImages.map((src, i) => (
            <button
              key={src}
              className={`detail-thumb ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
            >
              <FallbackImage
                src={src}
                alt=""
                fill
                sizes="5rem"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
