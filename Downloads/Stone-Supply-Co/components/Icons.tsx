import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const iconDefaults = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M8.5 3.5 10.2 7c.3.6.1 1.3-.4 1.7L8.5 9.8a15.7 15.7 0 0 0 5.7 5.7l1.1-1.3c.4-.5 1.1-.7 1.7-.4l3.5 1.7c.6.3.9.9.8 1.5l-.5 3c-.1.7-.8 1.2-1.5 1.2C10.2 21.2 2.8 13.8 2.8 4.7c0-.7.5-1.4 1.2-1.5l3-.5c.6-.1 1.2.2 1.5.8Z" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function AccessibilityIcon(props: IconProps) {
  return (
    <svg {...iconDefaults} {...props}>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M6 8.5h12" />
      <path d="m12 7.5-2 5.2-3 6.8" />
      <path d="m12 12.7 3.2 2.2 2 4.6" />
    </svg>
  );
}
