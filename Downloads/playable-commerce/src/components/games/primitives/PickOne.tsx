// src/components/games/primitives/PickOne.tsx
// Stub — full implementation in Task 8
import type { SkinConfig } from '../../../types';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  config: SkinConfig;
  skin: string;
  branding: BrandingColors;
  onResult: (success: boolean) => void;
}

export function PickOne({ branding, onResult }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      <p style={{ color: branding.textColor }} className="opacity-50 text-sm">
        PickOne — coming in Task 8
      </p>
      <button
        onClick={() => onResult(false)}
        className="px-6 py-3 rounded-lg font-bold text-sm"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        PICK (STUB)
      </button>
    </div>
  );
}
