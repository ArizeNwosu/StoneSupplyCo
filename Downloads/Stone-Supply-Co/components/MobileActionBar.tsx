"use client";

import { business } from "@/data/business";
import { MapPinIcon, PhoneIcon } from "./Icons";
import { TrackedLink } from "./TrackedLink";

export function MobileActionBar() {
  return (
    <aside className="mobile-action-bar" aria-label="Quick contact actions">
      <TrackedLink
        href={business.phone.href}
        eventName="phone_click"
        eventLabel="mobile_action_bar"
      >
        <PhoneIcon /> Call
      </TrackedLink>
      <span aria-hidden="true" />
      <TrackedLink
        href={business.directionsUrl}
        eventName="directions_click"
        eventLabel="mobile_action_bar"
        target="_blank"
        rel="noreferrer"
      >
        <MapPinIcon /> Directions
      </TrackedLink>
    </aside>
  );
}
