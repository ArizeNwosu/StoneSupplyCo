import { useState } from 'react';
import { TIMEFRAMES } from './intel/shared';
import { DrugCompare }   from './intel/DrugCompare';
import { AdverseEvents } from './intel/AdverseEvents';
import { JourneyFunnel } from './intel/JourneyFunnel';
import { BrandSwitch }   from './intel/BrandSwitch';
import { DosageIntel }   from './intel/DosageIntel';
import { PayerIntel }    from './intel/PayerIntel';
import { HCPSignals }    from './intel/HCPSignals';
import { TrendForecast } from './intel/TrendForecast';
import { UnmetNeeds }    from './intel/UnmetNeeds';

export default function Intel() {
  const [days, setDays] = useState(30);

  return (
    <div>
      {/* Shared timeframe selector */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-headline-md text-on-surface">Intelligence Hub</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Competitive benchmarks, safety signals, patient journey analytics, and AI-powered insights.
          </p>
        </div>
        <div className="flex border border-outline-variant rounded overflow-hidden shrink-0">
          {TIMEFRAMES.map((tf, i) => (
            <button
              key={tf.label}
              onClick={() => setDays(tf.days)}
              className={`px-4 py-2 text-label-caps transition-colors cursor-pointer ${
                days === tf.days
                  ? 'bg-surface-container-high text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              } ${i > 0 && i < TIMEFRAMES.length - 1 ? 'border-x border-outline-variant' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <DrugCompare   days={days} />
      <BrandSwitch   days={days} />
      <AdverseEvents days={days} />
      <PayerIntel    days={days} />
      <HCPSignals    days={days} />
      <DosageIntel   days={days} />
      <JourneyFunnel days={days} />
      <TrendForecast days={days} />
      <UnmetNeeds    days={days} />
    </div>
  );
}
