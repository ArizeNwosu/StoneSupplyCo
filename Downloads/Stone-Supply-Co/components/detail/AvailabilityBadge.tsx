import type { Availability } from "@/types/material";

const labels: Record<Availability, string> = {
  available: "In stock",
  low: "Low stock — act soon",
  unavailable: "Currently unavailable",
};

const classes: Record<Availability, string> = {
  available: "badge badge-available",
  low: "badge badge-low",
  unavailable: "badge badge-unavailable",
};

type Props = {
  availability: Availability;
  quantity?: number;
};

export function AvailabilityBadge({ availability, quantity }: Props) {
  return (
    <span className={classes[availability]}>
      {labels[availability]}
      {availability !== "unavailable" && quantity != null && quantity > 0
        ? ` · ${quantity} slab${quantity !== 1 ? "s" : ""}`
        : ""}
    </span>
  );
}
