import { useCallback, useEffect, useRef, useState } from 'react';
import { api, Filter, HistoryItem, Metrics, QueuePage, Source } from './api';
import { BackfillModal } from './components/BackfillModal';
import { MetricsPanel } from './components/MetricsPanel';
import { Pagination } from './components/Pagination';
import { ReplyCard } from './components/ReplyCard';
import { ReplyHistory } from './components/ReplyHistory';
import { SettingsPanel } from './components/SettingsPanel';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { getToken, saveToken, saveEmail, getSavedEmail, clearToken } from './api';

type Tab = 'queue' | 'history' | 'settings';

const FILTER_LABELS: Record<Filter, string> = {
  pending: 'Pending',
  flagged: '🚨 Flagged',
  rejected: 'Rejected',
};

const SOURCE_LABELS: Record<Source, string> = {
  all: 'All',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => getToken());
  const [authEmail, setAuthEmail] = useState<string | null>(() => getSavedEmail());
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  function handleAuthSuccess(token: string, email: string) {
    saveToken(token);
    saveEmail(email);
    setAuthToken(token);
    setAuthEmail(email);
  }

  function handleSignOut() {
    clearToken();
    setAuthToken(null);
    setAuthEmail(null);
  }

  const [mode, setMode]               = useState<'manual' | 'auto'>('manual');
  const [tab, setTab]                 = useState<Tab>('queue');
  const [filter, setFilter]           = useState<Filter>('pending');
  const [source, setSource]           = useState<Source>('all');
  const [page, setPage]               = useState(1);
  const [queueData, setQueueData]     = useState<QueuePage | null>(null);
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [metrics, setMetrics]         = useState<Metrics | null>(null);
  const [health, setHealth]           = useState<{ ok: boolean; account?: { username?: string; name?: string }; error?: string } | null>(null);
  const [modeLoading, setModeLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showBackfill, setShowBackfill]   = useState(false);
  const [showAutoConfirm, setShowAutoConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (p = page, f = filter, s = source) => {
    try {
      const [q, m, h] = await Promise.all([
        api.getQueue(p, f, 20, s),
        api.getMetrics(),
        api.getHistory(),
      ]);
      setQueueData(q);
      setMetrics(m);
      setHistory(h);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  }, [page, filter]);

  // Initial load
  useEffect(() => {
    api.getMode().then(({ mode: m }) => setMode(m as 'manual' | 'auto'));
    api.getHealth().then(setHealth).catch(() => setHealth({ ok: false, error: 'Cannot reach server' }));
    api.getBackfillStatus().then(s => { if (!s.done) setShowBackfill(true); });
    refresh(1, 'pending');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30s
  useEffect(() => {
    pollRef.current = setInterval(() => refresh(page, filter, source), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh, page, filter, source]);

  function changeFilter(f: Filter) {
    setFilter(f);
    setPage(1);
    refresh(1, f, source);
  }

  function changeSource(s: Source) {
    setSource(s);
    setPage(1);
    refresh(1, filter, s);
  }

  function changePage(p: number) {
    setPage(p);
    refresh(p, filter, source);
  }

  async function toggleMode() {
    if (mode === 'manual') {
      // Show custom confirm modal instead of native dialog
      setShowAutoConfirm(true);
      return;
    }
    // Switching back to manual — no confirmation needed
    setModeLoading(true);
    try {
      const { mode: m } = await api.setMode('manual');
      setMode(m as 'manual' | 'auto');
    } finally {
      setModeLoading(false);
    }
  }

  async function confirmAutoMode() {
    setShowAutoConfirm(false);
    setModeLoading(true);
    try {
      const { mode: m } = await api.setMode('auto');
      setMode(m as 'manual' | 'auto');
    } finally {
      setModeLoading(false);
    }
  }

  const flaggedCount   = metrics?.total_flagged ?? 0;
  const pendingCount   = queueData?.total ?? 0;

  if (!authToken) {
    if (authView === 'signup') {
      return <Signup onSuccess={handleAuthSuccess} onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSuccess={handleAuthSuccess} onSwitchToSignup={() => setAuthView('signup')} />;
  }

  return (
    <>
      {showBackfill && (
        <BackfillModal onComplete={() => {
          setShowBackfill(false);
          setTimeout(() => { refresh(1, 'pending'); api.getMetrics().then(setMetrics); }, 2000);
        }} />
      )}

      {showAutoConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '28px 28px 24px', maxWidth: 420, width: '100%',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🚀</div>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>
              Switch to Auto-Post?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Replies will post <strong style={{ color: 'var(--text)' }}>automatically</strong> on a 5–30 min stagger without your approval. Flagged comments are always held for manual review.
            </p>
            {metrics && metrics.total_pending > 0 && (
              <div style={{
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 7, padding: '10px 12px', marginBottom: 14, fontSize: 13,
                color: '#f59e0b',
              }}>
                ⚠️ <strong>{metrics.total_pending} pending replies</strong> are queued and will begin posting immediately — including any from your backfill.
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
              Only enable this after reviewing 3–5 days of manual replies to verify the AI voice is on-brand.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmAutoMode}
                style={{
                  flex: 1, background: 'var(--green)', color: '#000',
                  fontWeight: 700, fontSize: 14, padding: '10px 0',
                }}
              >
                Enable Auto-Post
              </button>
              <button
                onClick={() => setShowAutoConfirm(false)}
                style={{
                  flex: 1, background: 'var(--surface2)', color: 'var(--text)',
                  border: '1px solid var(--border)', fontWeight: 600, fontSize: 14, padding: '10px 0',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
              🐍 Snark Engine
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
              @splitflask · {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#666' }}>{authEmail}</span>
              <button
                onClick={handleSignOut}
                style={{ background: 'none', border: '1px solid #444', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 12, padding: '4px 10px' }}
              >
                Sign out
              </button>
            </div>
            {flaggedCount > 0 && (
              <button
                onClick={() => { setTab('queue'); changeFilter('flagged'); }}
                style={{
                  background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
                  borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                🚨 {flaggedCount} flagged
              </button>
            )}
            <button
              onClick={toggleMode}
              disabled={modeLoading}
              style={{
                padding: '8px 18px',
                background: mode === 'auto' ? 'var(--green)' : 'var(--surface2)',
                color: mode === 'auto' ? '#000' : 'var(--text)',
                border: mode === 'manual' ? '1px solid var(--border)' : 'none',
                fontWeight: 700, fontSize: 13,
              }}
            >
              {modeLoading ? '…' : mode === 'manual' ? '🔒 Manual Review' : '🚀 Auto-Post ON'}
            </button>
            <button
              onClick={() => refresh(page, filter)}
              style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', padding: '8px 12px' }}
              title="Refresh dashboard data from DB (does not re-poll Instagram)"
            >
              ↻
            </button>
          </div>
        </header>

        {/* Auto-post banner */}
        {mode === 'auto' && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8, padding: '10px 16px', marginBottom: 16,
            color: 'var(--green)', fontSize: 13,
          }}>
            🚀 <strong>Auto-Post active.</strong> Replies post automatically on a 5–30 min stagger. Flagged comments always require manual approval.
          </div>
        )}

        {/* ── Metrics ── */}
        <MetricsPanel metrics={metrics} health={health} />

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 0, borderBottom: '1px solid var(--border)' }}>
          {(['queue', 'history', 'settings'] as Tab[]).map(t => (
            <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === 'queue'    ? `Queue` :
               t === 'history'  ? 'History' : 'Settings'}
            </TabButton>
          ))}
        </div>

        {/* ── Queue filter pills ── */}
        {tab === 'queue' && (
          <div style={{ marginTop: 14, marginBottom: 16 }}>
            {/* Source row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {(['all', 'instagram', 'facebook'] as Source[]).map(s => (
                <button
                  key={s}
                  onClick={() => changeSource(s)}
                  style={{
                    padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    background: source === s ? 'var(--text)' : 'var(--surface2)',
                    color: source === s ? 'var(--bg)' : 'var(--muted)',
                    border: source === s ? 'none' : '1px solid var(--border)',
                    borderRadius: 20,
                  }}
                >
                  {s === 'instagram' ? '📸 ' : s === 'facebook' ? '🔵 ' : ''}{SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
            {/* Status row */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['pending', 'flagged', 'rejected'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => changeFilter(f)}
                  style={{
                    padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    background: filter === f ? 'var(--accent)' : 'var(--surface2)',
                    color: filter === f ? '#fff' : 'var(--muted)',
                    border: filter === f ? 'none' : '1px solid var(--border)',
                    borderRadius: 20,
                  }}
                >
                  {FILTER_LABELS[f]}
                  {f === 'pending' && pendingCount > 0 && filter !== 'pending'
                    ? ` (${pendingCount})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {tab === 'queue' && (
          <div>
            {!queueData || queueData.rows.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>
                  {filter === 'flagged' ? '🚨' : filter === 'rejected' ? '✗' : '✓'}
                </div>
                {filter === 'pending' ? 'Queue is empty — no pending comments.'
                 : filter === 'flagged' ? 'No flagged comments.'
                 : 'No rejected comments.'}
              </div>
            ) : (
              <>
                {queueData.rows.map(item => (
                  <ReplyCard key={item.id} item={item} onRefresh={() => refresh(page, filter)} />
                ))}
                <Pagination
                  page={queueData.page}
                  pages={queueData.pages}
                  total={queueData.total}
                  limit={queueData.limit}
                  onChange={changePage}
                />
              </>
            )}
          </div>
        )}

        {tab === 'history' && <ReplyHistory history={history} />}

        {tab === 'settings' && <SettingsPanel />}

      </div>
    </>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', color: active ? 'var(--text)' : 'var(--muted)',
        borderRadius: 0, padding: '8px 16px',
        fontWeight: active ? 700 : 400, fontSize: 14,
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        textTransform: 'capitalize',
      }}
    >
      {children}
    </button>
  );
}
