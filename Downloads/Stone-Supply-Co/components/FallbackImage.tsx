"use client";

import Image from "next/image";
import { useState } from "react";

type Props = React.ComponentProps<typeof Image>;

/**
 * Wraps next/image with an onError fallback.
 * When the source URL is unavailable the component renders a theme-consistent
 * stone placeholder that fills its positioned parent (position: relative with
 * a set height, or a fill-mode container).
 */
export function FallbackImage({ onError, ...props }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="stone-fallback"
        role="presentation"
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      {...props}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
