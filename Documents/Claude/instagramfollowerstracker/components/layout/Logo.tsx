import Image from 'next/image';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 32 }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Instagram Followers Tracker">
      <Image
        src="/site-icon.png"
        alt=""
        width={height}
        height={height}
        style={{ width: height, height: height }}
        priority
      />
      <svg
        viewBox="0 0 430 60"
        style={{ height: `${height}px`, width: 'auto' }}
        aria-hidden="true"
      >
        <defs>
          <style>{`
            .logo-dark { fill: #061026; }
            .logo-accent { fill: #0f766e; }
            @media (prefers-color-scheme: dark) {
              .logo-dark { fill: #e8edf5; }
              .logo-accent { fill: #22d3ee; }
            }
          `}</style>
        </defs>
        <text
          x="0"
          y="42"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="28"
          fontWeight="700"
          textAnchor="start"
          letterSpacing="0"
        >
          <tspan className="logo-dark">instagram</tspan>
          <tspan className="logo-accent">followers</tspan>
          <tspan className="logo-dark">tracker</tspan>
        </text>
      </svg>
    </span>
  );
}
