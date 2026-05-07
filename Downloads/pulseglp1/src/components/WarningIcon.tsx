import React from 'react';

export function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        style={{ userSelect: 'none' }}
      >
        !
      </text>
    </svg>
  );
}
