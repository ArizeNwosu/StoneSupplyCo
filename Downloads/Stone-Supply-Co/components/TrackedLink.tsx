"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackEvent, type ConversionEvent } from "@/lib/analytics";

type TrackedLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
> & {
  href: string;
  eventName: ConversionEvent;
  eventLabel: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function TrackedLink({
  href,
  eventName,
  eventLabel,
  children,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        trackEvent(eventName, { label: eventLabel, destination: href });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
