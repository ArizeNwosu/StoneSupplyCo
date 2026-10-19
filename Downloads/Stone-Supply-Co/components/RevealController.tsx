"use client";

import { useEffect } from "react";

/**
 * RevealController — scroll-driven fade-in animation system.
 *
 * Usage: add `data-reveal` to any element you want to animate in on scroll.
 * The element starts invisible (opacity 0, translateY 16px) via CSS and
 * gains `.is-visible` once it enters the viewport, triggering the transition.
 *
 * CSS counterpart lives in globals.css under `[data-reveal]` and `[data-reveal].is-visible`.
 * Respects `prefers-reduced-motion`: on reduced-motion devices all elements
 * become visible immediately with no animation.
 *
 * Example:
 *   <section data-reveal>...</section>
 *   <h2 data-reveal>...</h2>
 */
export function RevealController() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
