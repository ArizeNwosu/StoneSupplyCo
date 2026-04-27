// components/ProofCard.tsx
import type { CardData } from '@/types'
import { calcTotalLoss, calcDays, calcAvgLoss } from '@/lib/utils'
import { ProofCardChart } from './ProofCardChart'

interface Props {
  card: CardData
  width?: number   // default 1080
  height?: number  // default 1350
}

export function ProofCard({ card, width = 1080, height = 1350 }: Props) {
  const totalLoss = calcTotalLoss(card.startWeight, card.currentWeight)
  const days = calcDays(card.startDate, card.weightEntries.length > 0
    ? card.weightEntries[card.weightEntries.length - 1].date
    : card.startDate)
  const avgLoss = calcAvgLoss(totalLoss, days)

  const pad = 38
  const photoH = 480
  const statsH = 130
  const methodH = 72
  const footerH = 72
  const graphH = height - pad * 2 - photoH - statsH - methodH - footerH - 14 * 4

  return (
    <div style={{
      width,
      height,
      background: '#f9fbfa',
      borderRadius: 32,
      padding: pad,
      fontFamily: 'Inter, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box' as const,
      position: 'relative' as const,
    }}>

      {/* ── PHOTOS ── */}
      <div style={{ display: 'flex', gap: 12, position: 'relative' as const, height: photoH, flexShrink: 0 }}>

        {/* Before */}
        <div style={{
          flex: 1, height: photoH, borderRadius: 26, overflow: 'hidden', position: 'relative' as const,
          background: '#ccc',
        }}>
          {card.beforePhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.beforePhotoUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
          )}
          <div style={{
            position: 'absolute' as const, top: 28, left: 28,
            background: 'rgba(0,0,0,0.60)', color: 'white',
            padding: '12px 26px', borderRadius: 999,
            fontSize: 22, fontWeight: 800, letterSpacing: '0.06em',
          }}>BEFORE</div>
        </div>

        {/* After */}
        <div style={{
          flex: 1, height: photoH, borderRadius: 26, overflow: 'hidden', position: 'relative' as const,
          background: '#ccc',
        }}>
          {card.afterPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.afterPhotoUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
          )}
          <div style={{
            position: 'absolute' as const, top: 28, right: 28,
            background: 'rgba(0,0,0,0.60)', color: 'white',
            padding: '12px 26px', borderRadius: 999,
            fontSize: 22, fontWeight: 800, letterSpacing: '0.06em',
          }}>AFTER</div>
        </div>

        {/* Medallion centering wrapper — Satori-safe (no transform) */}
        <div style={{
          position: 'absolute' as const,
          bottom: 48,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none' as const,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            filter: 'drop-shadow(0 14px 32px rgba(0,0,0,0.20))',
          }}>
            {/* Pill tab */}
            <div style={{
              width: 82, height: 62,
              background: 'white',
              border: '9px solid #e8ede9',
              borderBottom: '9px solid white',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: -16,
              zIndex: 2,
              position: 'relative' as const,
            }}>
              <div style={{
                width: 34, height: 34,
                background: '#23624d',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
              }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <line x1="8" y1="1" x2="8" y2="14" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                  <polyline points="2,9 8,16 14,9" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            {/* Circle */}
            <div style={{
              width: 220, height: 220,
              background: 'white',
              border: '9px solid #e8ede9',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#23624d',
              zIndex: 1,
              position: 'relative' as const,
            }}>
              <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.85, letterSpacing: -2, marginTop: 10 }}>
                -{totalLoss}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.1 }}>
                {card.unit.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 23, fontStyle: 'italic', color: '#4a6b5e', marginTop: 4 }}>
                in {days} days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{
        background: 'white',
        borderRadius: 22,
        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        marginTop: 16,
        padding: '30px 44px',
        display: 'flex',
        flexShrink: 0,
      }}>
        {[
          { label: 'Start Weight', value: card.startWeight },
          { label: 'Current Weight', value: card.currentWeight },
          { label: 'Goal Weight', value: card.goalWeight },
        ].map((stat, i, arr) => (
          <div key={stat.label} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            paddingLeft: i === 0 ? 0 : 24,
            paddingRight: i === arr.length - 1 ? 0 : 24,
            borderRight: i < arr.length - 1 ? '1px solid #d9dfdc' : 'none',
          }}>
            <div style={{
              width: 72, height: 72,
              background: '#e9f2ec',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {i === 0 && <ScaleIcon />}
              {i === 1 && <FlagIcon />}
              {i === 2 && <TargetIcon />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#13201d', letterSpacing: '0.04em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, marginTop: 6, color: '#13201d' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 22, color: '#23624d', fontWeight: 800, marginTop: 4, letterSpacing: '0.04em' }}>
                {card.unit.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── GRAPH ── */}
      <div style={{
        background: 'white',
        borderRadius: 22,
        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        marginTop: 14,
        padding: '24px 18px 20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.04em', color: '#13201d' }}>
              MY PROGRESS
            </div>
            <div style={{ fontSize: 18, color: '#8aa098', marginTop: 6, fontWeight: 500 }}>
              Day 1 → Day {days}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 24px',
            border: '1.5px solid #dde4e0', borderRadius: 16,
          }}>
            <div style={{
              width: 52, height: 52, background: '#e9f2ec',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendIcon />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#8aa098', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                AVG. LOSS
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#13201d', lineHeight: 1.1 }}>
                  {avgLoss}
                </div>
                <div style={{ fontSize: 15, color: '#8aa098', fontWeight: 600 }}>
                  {card.unit.toUpperCase()} / WEEK
                </div>
              </div>
            </div>
          </div>
        </div>

        {card.weightEntries.length >= 2 && (
          <div style={{ flex: 1, display: 'flex', marginTop: 14 }}>
            <ProofCardChart
              entries={card.weightEntries}
              unit={card.unit}
              width={width - pad * 2 - 18 * 2}
              height={graphH}
            />
          </div>
        )}
      </div>

      {/* ── METHOD ── */}
      <div style={{
        background: '#eef6f0',
        borderRadius: 22,
        marginTop: 14,
        padding: '22px 44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        color: '#23624d',
        flexShrink: 0,
      }}>
        <LeafIcon />
        <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: '0.04em' }}>
          METHOD: {card.method}
        </span>
        <div style={{ width: 6, height: 6, background: '#5aaa7e', borderRadius: '50%' }} />
        <span style={{ color: '#5aaa7e', fontSize: 19, fontWeight: 700, letterSpacing: '0.03em' }}>
          {card.habits.join(', ')}
        </span>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 14,
        background: '#0d0d0d',
        borderRadius: 22,
        padding: '22px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, fontWeight: 700, color: 'white' }}>
          <div style={{
            width: 38, height: 38, background: '#23624d',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LeafIconWhite />
          </div>
          <span>Made with ProofCard</span>
          <div style={{ width: 1, height: 28, background: '#333', margin: '0 4px' }} />
          <span style={{ fontWeight: 500, color: '#8aa098' }}>Your progress. Your proof.</span>
        </div>
        <div style={{ fontSize: 19, color: '#5aaa7e', fontStyle: 'italic' }}>proofcard.app</div>
      </div>

      {/* Watermark overlay (free/guest) */}
      {card.watermarked && (
        <div style={{
          position: 'absolute' as const, bottom: 58, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          opacity: 0.12, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: '#13201d', letterSpacing: 8, textTransform: 'uppercase' as const }}>
            proofcard.app
          </span>
        </div>
      )}
    </div>
  )
}

// ── SVG Icon Components ──────────────────────────────────────────────────

function ScaleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#23624d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1M3 12h1m16 0h1"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 8a4 4 0 0 1 0 8"/>
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#23624d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#23624d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#23624d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#23624d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
}

function LeafIconWhite() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
}
