"use client";

import { useState } from "react";
import { business } from "@/data/business";
import { trackEvent } from "@/lib/analytics";
import { MapPinIcon, PlusIcon } from "./Icons";

export function MapPanel() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div className="map-frame">
        <iframe
          src={business.mapEmbedUrl}
          title="Interactive map showing Stone Supply Co. in Northridge"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      className="map-placeholder"
      type="button"
      onClick={() => {
        trackEvent("map_load", { label: "location_section" });
        setLoaded(true);
      }}
      aria-label="Load interactive Google Map"
    >
      <span className="map-grid" aria-hidden="true" />
      <span className="map-coordinate map-coordinate-top">
        34.2347° N
      </span>
      <span className="map-pin-mark" aria-hidden="true">
        <MapPinIcon />
      </span>
      <span className="map-address">
        <strong>Stone Supply Co.</strong>
        <small>Northridge, California</small>
      </span>
      <span className="map-load-label">
        Load interactive map <PlusIcon />
      </span>
      <span className="map-coordinate map-coordinate-bottom">
        118.5702° W
      </span>
    </button>
  );
}
