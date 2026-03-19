import React from 'react';
import { AlertCircle, ArrowLeft, Clock3, Loader2, Mic, Phone, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import type {
  CreateLiveAssistSessionRequest,
  EndLiveAssistSessionResponse,
  LiveAssistActionType,
  LiveAssistIntent,
  LiveAssistSession,
  LiveAssistSuggestion,
  LiveAssistSummary,
  LiveAssistTurn,
  LiveAssistScenarioType,
  Tone,
} from '../types';
import { Button, Card, cn } from './ui';

const SCENARIO_OPTIONS: Array<{ value: LiveAssistScenarioType; label: string; hint: string }> = [
  { value: 'doctor', label: 'Doctor', hint: 'appointments, referrals, follow-ups' },
  { value: 'landlord', label: 'Landlord', hint: 'repairs, rent, lease issues' },
  { value: 'customer_support', label: 'Customer Support', hint: 'billing, complaints, account help' },
  { value: 'insurance', label: 'Insurance', hint: 'claims, benefits, coverage' },
  { value: 'bank', label: 'Bank', hint: 'card issues, fraud, fees' },
  { value: 'reservation', label: 'Reservation', hint: 'booking, cancellations, availability' },
  { value: 'general_business', label: 'Business', hint: 'offices, schools, service providers' },
];

const ACTION_COPY: Record<LiveAssistActionType, string> = {
  pushback: 'They pushed back',
  question: 'They asked a question',
  freeze: "I'm freezing",
  shorter: 'Shorter',
  alternate: 'Alternate',
  end: 'End',
};

type LiveAssistSetupScreenProps = {
  isDark: boolean;
  draft: CreateLiveAssistSessionRequest;
  onChange: (patch: Partial<CreateLiveAssistSessionRequest>) => void;
  onBack: () => void;
  onStart: () => void;
  loading: boolean;
  error?: string | null;
};

export function LiveAssistSetupScreen({
  isDark,
  draft,
  onChange,
  onBack,
  onStart,
  loading,
  error = null,
}: LiveAssistSetupScreenProps) {
  return (
    <div className="space-y-6 pb-24">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'inline-flex items-center gap-2 text-sm font-semibold transition-colors',
          isDark ? 'text-[#b7c3bd] hover:text-white' : 'text-[#66756f] hover:text-[#22312b]',
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card isDark={isDark} className="p-6 space-y-3">
        <div className="space-y-1">
          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            Live Assist
          </p>
          <h2 className={cn('text-2xl font-semibold tracking-tight', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
            Set up the call before it starts
          </h2>
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
            Callmate will listen while you are on speaker and show one short sentence you can say next.
          </p>
        </div>

        <div className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#b7c3bd]' : 'border-[#d8cdc0] bg-[#f5efe6] text-[#5d6963]')}>
          Works best for business and service calls. Keep the app open and the call on speaker.
        </div>
      </Card>

      <section className="space-y-3">
        <p className={cn('text-xs font-black uppercase tracking-[0.24em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
          Call Type
        </p>
        <div className="grid grid-cols-1 gap-3">
          {SCENARIO_OPTIONS.map((option) => {
            const active = option.value === draft.scenarioType;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ scenarioType: option.value })}
                className={cn(
                  'rounded-[1.6rem] border p-4 text-left transition-all',
                  active
                    ? isDark
                      ? 'border-[#8fae9e] bg-[linear-gradient(135deg,#274136_0%,#20342b_100%)] text-white'
                      : 'border-[#8fae9e] bg-[linear-gradient(135deg,#eef5f1_0%,#e5efe9_100%)] text-[#22312b]'
                    : isDark
                    ? 'border-[#415049] bg-[#202926] text-[#dce6df]'
                    : 'border-[#d8cdc0] bg-[rgba(255,251,245,0.94)] text-[#22312b]',
                )}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className={cn('mt-1 text-xs', active ? (isDark ? 'text-[#c7d7cf]' : 'text-[#587567]') : isDark ? 'text-[#97a59f]' : 'text-[#7a8882]')}>
                  {option.hint}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <Card isDark={isDark} className="p-0 overflow-hidden">
        <div className="p-5 space-y-5">
          <FieldLabel isDark={isDark}>Contact</FieldLabel>
          <textarea
            value={draft.contactName}
            onChange={(event) => onChange({ contactName: event.target.value.slice(0, 80) })}
            placeholder="Doctor's office, landlord, customer support..."
            className={textareaClassName(isDark, 'h-20')}
          />

          <FieldLabel isDark={isDark}>What do you want from the call?</FieldLabel>
          <textarea
            value={draft.goal}
            onChange={(event) => onChange({ goal: event.target.value.slice(0, 220) })}
            placeholder="Get a clear answer, schedule an appointment, resolve a billing issue..."
            className={textareaClassName(isDark)}
          />

          <FieldLabel isDark={isDark}>What are you worried about?</FieldLabel>
          <textarea
            value={draft.worries.join('\n')}
            onChange={(event) =>
              onChange({
                worries: event.target.value
                  .split('\n')
                  .filter((item) => item.trim().length > 0)
                  .slice(0, 3),
              })
            }
            placeholder={'They will brush me off\nI will freeze if they push back'}
            className={textareaClassName(isDark)}
          />
        </div>

        <div className={cn('border-t p-4 space-y-4', isDark ? 'border-[#415049] bg-[#171f1d]' : 'border-[#d8cdc0] bg-[#f5efe6]')}>
          <div className="flex flex-wrap gap-2">
            {(['Professional', 'Assertive', 'Friendly', 'Firm'] as Tone[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ tone: option })}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                  draft.tone === option
                    ? isDark
                      ? 'bg-[#f3eee4] text-[#22312b]'
                      : 'bg-[#5d8a7a] text-white'
                    : isDark
                    ? 'bg-[#242d2a] text-[#a8b4ae] border border-[#415049]'
                    : 'bg-[#ece5da] text-[#66756f] border border-[#d8cdc0]',
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <label className={cn('flex items-start gap-3 rounded-2xl border p-4 text-sm', isDark ? 'border-[#415049] bg-[#202926]' : 'border-[#d8cdc0] bg-white/75')}>
            <input
              type="checkbox"
              checked={draft.transcriptOptIn}
              onChange={(event) => onChange({ transcriptOptIn: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border-[#8fae9e] text-[#5d8a7a] focus:ring-[#5d8a7a]"
            />
            <span className={cn('leading-relaxed', isDark ? 'text-[#b7c3bd]' : 'text-[#5f6e67]')}>
              Save transcript snippets for review after the call. Audio is never stored.
            </span>
          </label>
        </div>
      </Card>

      {error && (
        <div className={cn('rounded-2xl border p-4 text-sm', isDark ? 'border-red-800/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700')}>
          {error}
        </div>
      )}

      <Button
        size="xl"
        variant="primary"
        isDark={isDark}
        disabled={loading || !draft.contactName.trim() || !draft.goal.trim()}
        className="w-full h-14 font-bold"
        onClick={onStart}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Build Live Assist Brief</>}
      </Button>
    </div>
  );
}

type LiveAssistBriefScreenProps = {
  isDark: boolean;
  session: LiveAssistSession;
  onBack: () => void;
  onStart: () => void;
};

export function LiveAssistBriefScreen({ isDark, session, onBack, onStart }: LiveAssistBriefScreenProps) {
  return (
    <div className="space-y-6 pb-24">
      <button type="button" onClick={onBack} className={cn('inline-flex items-center gap-2 text-sm font-semibold', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card isDark={isDark} className="p-6 space-y-4">
        <div className="space-y-2">
          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            Pre-Call Brief
          </p>
          <h2 className={cn('text-2xl font-semibold tracking-tight', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
            {session.contactName}
          </h2>
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
            Keep this simple. Start the call, put it on speaker, and come back here if you freeze.
          </p>
        </div>

        <BriefRow isDark={isDark} label="Opening line" value={session.brief.openingLine} />
        <BriefRow isDark={isDark} label="Goal" value={session.brief.goalReminder} />
        <BriefRow isDark={isDark} label="If I freeze" value={session.brief.freezeLine} accent />

        <div className="space-y-2">
          <p className={cn('text-xs font-black uppercase tracking-[0.22em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            Likely Pushback
          </p>
          <div className="space-y-2">
            {session.brief.likelyObjections.map((item) => (
              <div key={item} className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#d7e3db]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#42554e]')}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Button size="xl" variant="primary" isDark={isDark} className="w-full h-14 font-bold" onClick={onStart}>
        <Phone className="w-5 h-5" />
        Start Live Assist
      </Button>
    </div>
  );
}

type LiveAssistCallScreenProps = {
  isDark: boolean;
  session: LiveAssistSession;
  turns: LiveAssistTurn[];
  suggestion: LiveAssistSuggestion | null;
  state: {
    latestTranscript: string;
    activeIntent: LiveAssistIntent | null;
    freezeMode: boolean;
  };
  elapsedMs: number;
  thinking: boolean;
  error?: string | null;
  onTranscriptChange: (value: string) => void;
  onGetSuggestion: () => void;
  onAction: (action: LiveAssistActionType) => void;
  onFinish: () => void;
};

export function LiveAssistCallScreen({
  isDark,
  session,
  turns,
  suggestion,
  state,
  elapsedMs,
  thinking,
  error = null,
  onTranscriptChange,
  onGetSuggestion,
  onAction,
  onFinish,
}: LiveAssistCallScreenProps) {
  const latestOtherLine = [...turns].reverse().find((turn) => turn.speaker === 'other')?.text || state.latestTranscript;
  const displaySuggestion = state.freezeMode ? session.fallbacks.freeze : suggestion?.primary || session.brief.freezeLine;

  return (
    <div className="space-y-5 pb-28">
      <Card isDark={isDark} className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className={cn('text-xs font-black uppercase tracking-[0.24em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
              Live Assist
            </p>
            <h2 className={cn('text-xl font-semibold tracking-tight', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
              {session.brief.goalReminder}
            </h2>
          </div>
          <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', isDark ? 'bg-[#202926] text-[#d7e3db]' : 'bg-[#ece5da] text-[#5f6d66]')}>
            <Clock3 className="mr-1 inline h-3.5 w-3.5" />
            {formatElapsed(elapsedMs)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', thinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')} />
          <p className={cn('text-sm font-medium', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
            {thinking ? 'Thinking...' : 'Listening...'}
          </p>
        </div>

        <div className={cn('rounded-[1.6rem] border p-4', isDark ? 'border-[#415049] bg-[#171f1d]' : 'border-[#d8cdc0] bg-[#fffaf2]')}>
          <p className={cn('text-[11px] font-black uppercase tracking-[0.22em] mb-2', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            Last Heard
          </p>
          <p className={cn('text-sm leading-relaxed min-h-[2.75rem]', isDark ? 'text-[#edf3ee]' : 'text-[#30423b]')}>
            {latestOtherLine || 'As the other person speaks, their last sentence will appear here.'}
          </p>
        </div>
      </Card>

      <Card isDark={isDark} className={cn('p-5 space-y-3 border-2', state.freezeMode ? (isDark ? 'border-[#9b7a37]' : 'border-[#ddc8a5]') : (isDark ? 'border-[#527a6c]' : 'border-[#bfd2c8]'))}>
        <div className="flex items-center justify-between gap-3">
          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', state.freezeMode ? (isDark ? 'text-[#dfc090]' : 'text-[#a17e4d]') : isDark ? 'text-[#9ec5b4]' : 'text-[#5d8a7a]')}>
            {state.freezeMode ? 'Freeze Line' : 'Say This'}
          </p>
          {suggestion?.intent && !state.freezeMode && (
            <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', isDark ? 'bg-[#202926] text-[#c7d7cf]' : 'bg-[#eef5f1] text-[#5d8a7a]')}>
              {suggestion.intent}
            </span>
          )}
        </div>
        <p className={cn('text-2xl font-semibold leading-tight', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
          {displaySuggestion}
        </p>
        {!state.freezeMode && suggestion?.alternate && (
          <div className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#c7d7cf]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#52635c]')}>
            Alternate: {suggestion.alternate}
          </div>
        )}
      </Card>

      <Card isDark={isDark} className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mic className={cn('w-4 h-4', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')} />
          <p className={cn('text-xs font-black uppercase tracking-[0.22em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            Manual Transcript Input
          </p>
        </div>
        <textarea
          value={state.latestTranscript}
          onChange={(event) => onTranscriptChange(event.target.value.slice(0, 240))}
          placeholder="For now, paste or type the last thing the other person said..."
          className={textareaClassName(isDark)}
        />
        <Button size="lg" variant="primary" isDark={isDark} className="w-full h-12 font-semibold" disabled={thinking || !state.latestTranscript.trim()} onClick={onGetSuggestion}>
          {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Get next line</>}
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {(['pushback', 'question', 'freeze', 'shorter', 'alternate', 'end'] as LiveAssistActionType[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => (action === 'end' ? onFinish() : onAction(action))}
            className={cn(
              'rounded-[1.4rem] border px-4 py-4 text-left text-sm font-semibold transition-all',
              action === 'freeze'
                ? isDark
                  ? 'border-[#8f7752] bg-[#3f341f] text-[#f3e2b2]'
                  : 'border-[#ddc8a5] bg-[#f7eddc] text-[#8d6a36]'
                : isDark
                ? 'border-[#415049] bg-[#202926] text-[#dce6df]'
                : 'border-[#d8cdc0] bg-[rgba(255,251,245,0.94)] text-[#22312b]',
            )}
          >
            {ACTION_COPY[action]}
          </button>
        ))}
      </div>

      <div className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#b7c3bd]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#5d6963]')}>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Speakerphone only. Keep the app in the foreground. This MVP shell uses manual transcript input until live listening is wired in.
          </p>
        </div>
      </div>

      {error && (
        <div className={cn('rounded-2xl border p-4 text-sm', isDark ? 'border-red-800/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700')}>
          {error}
        </div>
      )}
    </div>
  );
}

type LiveAssistSummaryScreenProps = {
  isDark: boolean;
  summary: EndLiveAssistSessionResponse | LiveAssistSummary;
  onDone: () => void;
};

export function LiveAssistSummaryScreen({ isDark, summary, onDone }: LiveAssistSummaryScreenProps) {
  return (
    <div className="space-y-6 pb-24">
      <Card isDark={isDark} className="p-6 space-y-4">
        <div className="space-y-2">
          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            After the Call
          </p>
          <h2 className={cn('text-2xl font-semibold tracking-tight', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
            Quick review
          </h2>
        </div>

        <div className={cn('rounded-[1.6rem] border p-4', isDark ? 'border-[#527a6c] bg-[#20342b]' : 'border-[#bfd2c8] bg-[#eef5f1]')}>
          <p className={cn('text-base leading-relaxed font-medium', isDark ? 'text-[#eef4ef]' : 'text-[#294039]')}>
            {summary.summary}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className={cn('text-xs font-black uppercase tracking-[0.22em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
              Objections
            </p>
            {summary.objections.length > 0 ? summary.objections.map((item) => (
              <div key={item} className={cn('rounded-2xl border px-4 py-3 text-sm capitalize', isDark ? 'border-[#415049] bg-[#171f1d] text-[#d7e3db]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#42554e]')}>
                {item}
              </div>
            )) : (
              <div className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#97a59f]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#66756f]')}>
                No major pushback detected.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className={cn('text-xs font-black uppercase tracking-[0.22em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
              Next time
            </p>
            {summary.improvements.map((item) => (
              <div key={item} className={cn('rounded-2xl border px-4 py-3 text-sm', isDark ? 'border-[#415049] bg-[#171f1d] text-[#d7e3db]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#42554e]')}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className={cn('rounded-2xl border px-4 py-3 text-sm flex items-start gap-2', isDark ? 'border-[#415049] bg-[#171f1d] text-[#b7c3bd]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#5d6963]')}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{summary.helpfulnessPrompt}</span>
        </div>
      </Card>

      <Button size="xl" variant="primary" isDark={isDark} className="w-full h-14 font-bold" onClick={onDone}>
        Back to Home
      </Button>
    </div>
  );
}

function BriefRow({ isDark, label, value, accent = false }: { isDark: boolean; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn('rounded-[1.4rem] border p-4', accent ? (isDark ? 'border-[#8f7752] bg-[#3f341f]' : 'border-[#ddc8a5] bg-[#f7eddc]') : (isDark ? 'border-[#415049] bg-[#171f1d]' : 'border-[#d8cdc0] bg-[#fffaf2]'))}>
      <p className={cn('text-xs font-black uppercase tracking-[0.22em] mb-2', accent ? (isDark ? 'text-[#dfc090]' : 'text-[#a17e4d]') : isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
        {label}
      </p>
      <p className={cn('text-sm leading-relaxed', accent ? (isDark ? 'text-[#f3e2b2]' : 'text-[#6f5122]') : isDark ? 'text-[#edf3ee]' : 'text-[#30423b]')}>
        {value}
      </p>
    </div>
  );
}

function FieldLabel({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <p className={cn('text-xs font-black uppercase tracking-[0.22em]', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
      {children}
    </p>
  );
}

function textareaClassName(isDark: boolean, extraClassName = 'h-24') {
  return cn(
    'w-full rounded-[1.4rem] border px-4 py-3 text-sm leading-relaxed focus:outline-none resize-none',
    extraClassName,
    isDark ? 'border-[#415049] bg-[#171f1d] text-white placeholder:text-[#798780]' : 'border-[#d8cdc0] bg-[#fffaf2] text-[#22312b] placeholder:text-[#95a19c]',
  );
}

function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
