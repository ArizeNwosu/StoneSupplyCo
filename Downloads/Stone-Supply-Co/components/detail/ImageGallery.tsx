"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  name: string;
};

export function ImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
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
        <Image
          src={images[active]}
          alt={`${name} slab — view ${active + 1}`}
          fill
          priority={active === 0}
          sizes="(max-width: 900px) 100vw, 60vw"
        />
      </div>

      {images.length > 1 && (
        <div className="detail-gallery-thumbs" role="list">
          {images.map((src, i) => (
            <button
              key={src}
              role="listitem"
              className={`detail-thumb ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
            >
              <Image
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
