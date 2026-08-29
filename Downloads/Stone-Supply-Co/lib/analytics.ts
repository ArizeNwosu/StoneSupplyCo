export type ConversionEvent =
  | "phone_click"
  | "directions_click"
  | "inventory_click"
  | "service_click"
  | "review_click"
  | "social_click"
  | "map_load"
  | "material_view"
  | "material_save"
  | "material_compare"
  | "stone_finder_start"
  | "stone_finder_complete"
  | "visualizer_start"
  | "visualizer_complete"
  | "availability_request"
  | "trade_application"
  | "project_created"
  | "showroom_request"
  | "ai_content_generate";

type EventPayload = {
  event: ConversionEvent;
  label?: string;
  destination?: string;
};

declare global {
  interface Window {
    dataLayer?: EventPayload[];
  }
}

/**
 * Analytics-neutral conversion hook. If a dataLayer is added later, events
 * flow into it automatically. The CustomEvent keeps local integrations easy
 * without introducing a tracker, cookies, or third-party JavaScript today.
 */
export function trackEvent(
  event: ConversionEvent,
  payload: Omit<EventPayload, "event"> = {},
) {
  if (typeof window === "undefined") return;

  const detail: EventPayload = { event, ...payload };
  window.dataLayer?.push(detail);
  window.dispatchEvent(new CustomEvent("stone-supply:conversion", { detail }));
}
